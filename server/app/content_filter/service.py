"""
Content Filter Service: Coordinates classification, Redis caching,
database alert storage, and automated WhatsApp / Web Push alert dispatching.
"""
import logging
import uuid
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Family, FamilyMember, NotificationPreferences, User
from app.ai_engine.cache import get_cached_classification, set_cached_classification
from app.ai_engine.classifier import classify_text
from app.ai_engine.preprocessing import preprocess_arabic
from app.alerts.notifications import send_web_push_alert
from app.content_filter.models import Alert
from app.content_filter.schemas import AccessAppealRequest, AlertResponse, PredictRequest, PredictResponse

logger = logging.getLogger(__name__)


async def _dispatch_notifications_task(
    wp_token: str | None,
    category: str,
    child_name: str,
    confidence: float,
) -> bool:
    """Send real-time Web Push notification to the parent device."""
    if not wp_token:
        return False
    return await send_web_push_alert(
        web_push_token=wp_token,
        child_name=child_name,
        category=category,
        confidence=confidence,
    )


async def classify_and_handle(
    db: AsyncSession,
    redis_client,
    data: PredictRequest,
    background_tasks: BackgroundTasks | None = None,
) -> PredictResponse:
    """
    Classify incoming text, consult/update Redis cache, persist threats as alerts,
    and trigger automated WhatsApp / Web Push notifications to the parent.
    """
    cached = False
    cleaned_key_text = preprocess_arabic(data.text) or data.text.strip()

    # Step 1: Redis Cache Check (using preprocessed Arabic text for higher hit rate)
    cached_result = await get_cached_classification(redis_client, cleaned_key_text)
    if cached_result:
        result = cached_result
        cached = True
    else:
        # Step 2: Dual-Model Classification
        result = await classify_text(data.text)
        # Step 3: Populate Cache (24h TTL)
        await set_cached_classification(redis_client, cleaned_key_text, result)

    category = result["category"]
    confidence = result["confidence"]
    raw_is_blocked = result.get("is_blocked", False)
    block_reason: str | None = None

    # Convert child_id to UUID if provided
    child_uuid = None
    if data.child_id:
        try:
            child_uuid = uuid.UUID(data.child_id) if isinstance(data.child_id, str) else data.child_id
        except ValueError:
            logger.error("Invalid child_id: %s", data.child_id)

    # Step 4: Consult Child Policy (if child_uuid is valid)
    is_blocked = raw_is_blocked
    policy = None
    if child_uuid:
        from app.policies.models import Policy
        p_res = await db.execute(select(Policy).where(Policy.child_id == child_uuid))
        policy = p_res.scalar_one_or_none()

        if policy:
            # Evaluate AI category against child-specific sensitivity_threshold
            if category != "SAFE":
                is_blocked = confidence >= policy.sensitivity_threshold

                # Check category specific toggles
                if category == "VIOLENCE" and not policy.block_violence:
                    is_blocked = False
                elif category == "SEXUAL" and not policy.block_sexual:
                    is_blocked = False
                elif category == "CYBERBULLYING" and not policy.block_cyberbullying:
                    is_blocked = False
                elif category == "HATE_SPEECH" and not policy.block_hate_speech:
                    is_blocked = False

                if is_blocked:
                    block_reason = f"AI Threat Detected: {category} ({confidence * 100:.0f}%)"

            # Check blocked apps
            if data.context_app and data.context_app in (policy.blocked_apps or []):
                is_blocked = True
                block_reason = f"Blocked Application: {data.context_app}"
                if category == "SAFE":
                    category = "BLOCKED_APP"
                    confidence = 1.0

            # Check custom blacklisted URLs / domains
            text_lower = data.text.lower()
            for blacklisted_url in (policy.custom_blacklist_urls or []):
                clean_domain = blacklisted_url.strip().lower()
                if clean_domain and clean_domain in text_lower:
                    is_blocked = True
                    block_reason = f"Blacklisted URL: {blacklisted_url}"
                    if category == "SAFE":
                        category = "BLACKLISTED_URL"
                        confidence = 1.0
                    break
        elif is_blocked:
            block_reason = f"AI Threat Detected: {category} ({confidence * 100:.0f}%)"
    elif is_blocked:
        block_reason = f"AI Threat Detected: {category} ({confidence * 100:.0f}%)"

    # Step 5: Log Activity Event (Privacy: only persist text snippet when blocked/flagged)
    created_alert_id: uuid.UUID | None = None
    if child_uuid:
        from app.activity.models import ActivityEvent
        activity = ActivityEvent(
            child_id=child_uuid,
            app_name=data.context_app,
            url=None,
            content_snippet=data.text[:200] if is_blocked else "[SAFE_CONTENT_REDACTED]",
            category=category,
            confidence=confidence,
            verdict="BLOCKED" if is_blocked else "ALLOWED",
        )
        db.add(activity)

    # Step 6: If content is blocked/unsafe, handle Alert & Notification Dispatch
    if is_blocked and child_uuid:
        fm_result = await db.execute(
            select(FamilyMember, Family)
            .join(Family, FamilyMember.family_id == Family.id)
            .where(FamilyMember.child_id == child_uuid)
        )
        row = fm_result.first()

        if row:
            _, family = row
            parent_id = family.parent_id

            parent_result = await db.execute(
                select(User, NotificationPreferences)
                .outerjoin(NotificationPreferences, User.id == NotificationPreferences.user_id)
                .where(User.id == parent_id)
            )
            parent_row = parent_result.first()

            child_user = await db.get(User, child_uuid)
            child_name = child_user.full_name if child_user else "الطفل"

            alert = Alert(
                child_id=child_uuid,
                parent_id=parent_id,
                content_snippet=data.text[:200],
                category=category,
                confidence=confidence,
                verdict="BLOCKED",
                context_app=data.context_app,
                whatsapp_sent=False,
                web_push_sent=False,
                review_status="PENDING",
            )
            db.add(alert)
            await db.flush()
            created_alert_id = alert.id

            if parent_row:
                _, prefs = parent_row
                if prefs and prefs.web_push_enabled and prefs.web_push_token:
                    if background_tasks is not None:
                        background_tasks.add_task(
                            _dispatch_notifications_task,
                            prefs.web_push_token,
                            category,
                            child_name,
                            confidence,
                        )
                    else:
                        wp_sent = await _dispatch_notifications_task(
                            prefs.web_push_token,
                            category,
                            child_name,
                            confidence,
                        )
                        alert.web_push_sent = wp_sent

    await db.commit()

    return PredictResponse(
        verdict="BLOCKED" if is_blocked else "ALLOWED",
        category=category,
        confidence=confidence,
        is_blocked=is_blocked,
        block_reason=block_reason,
        alert_id=created_alert_id,
        execution_time_ms=result.get("execution_time_ms", 0.0),
        cached=cached,
    )


async def get_parent_alerts(
    db: AsyncSession,
    parent_id: uuid.UUID,
    category: str | None = None,
    child_id: uuid.UUID | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
    is_admin: bool = False,
) -> list[Alert]:
    """Retrieve filtered alerts list for the parent dashboard (or all alerts for admin)."""
    query = select(Alert)
    if not is_admin:
        query = query.where(Alert.parent_id == parent_id)
    if child_id:
        query = query.where(Alert.child_id == child_id)
    if category and category.upper() != "ALL":
        query = query.where(Alert.category == category.upper())
    if search:
        pat = f"%{search.strip()}%"
        query = query.where(Alert.content_snippet.ilike(pat) | Alert.context_app.ilike(pat))

    query = query.order_by(desc(Alert.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def submit_access_appeal(
    db: AsyncSession,
    current_user: User,
    data: AccessAppealRequest,
) -> AlertResponse:
    """Allow a child (or parent) to submit an access request / false-positive appeal (UC-C5)."""
    if current_user.role == "child" and current_user.id != data.child_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child can only submit access requests for their own account",
        )

    alert: Alert | None = None
    if data.alert_id:
        alert = await db.get(Alert, data.alert_id)
        if alert and alert.child_id != data.child_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Alert does not belong to this child")

    if not alert:
        # Find the most recent alert for this child
        res = await db.execute(
            select(Alert)
            .where(Alert.child_id == data.child_id)
            .order_by(desc(Alert.created_at))
            .limit(1)
        )
        alert = res.scalar_one_or_none()

    if not alert:
        # Create an access-request alert record for the parent
        fm_res = await db.execute(
            select(Family.parent_id)
            .join(FamilyMember, FamilyMember.family_id == Family.id)
            .where(FamilyMember.child_id == data.child_id)
        )
        parent_id = fm_res.scalar_one_or_none()
        if not parent_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found for child")

        alert = Alert(
            child_id=data.child_id,
            parent_id=parent_id,
            content_snippet=data.reason,
            category="ACCESS_REQUEST",
            confidence=1.0,
            verdict="BLOCKED",
            context_app=data.context_app,
            review_status="ACCESS_REQUESTED",
            access_request_reason=data.reason,
        )
        db.add(alert)
    else:
        alert.review_status = "ACCESS_REQUESTED"
        alert.access_request_reason = data.reason

    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
