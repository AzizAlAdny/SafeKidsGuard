"""
Content Filter Service: Coordinates classification, Redis caching,
database alert storage, and automated WhatsApp alert dispatching.
"""
import logging
import uuid
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Family, FamilyMember, NotificationPreferences, User
from app.ai_engine.cache import get_cached_classification, set_cached_classification
from app.ai_engine.classifier import classify_text
from app.alerts.whatsapp import send_whatsapp_alert
from app.content_filter.models import Alert
from app.content_filter.schemas import PredictRequest, PredictResponse

logger = logging.getLogger(__name__)


async def classify_and_handle(
    db: AsyncSession, redis_client, data: PredictRequest
) -> PredictResponse:
    """
    Classify incoming text, consult/update Redis cache, persist threats as alerts,
    and trigger automated WhatsApp notifications to the parent.
    """
    cached = False

    # Step 1: Redis Cache Check
    cached_result = await get_cached_classification(redis_client, data.text)
    if cached_result:
        result = cached_result
        cached = True
    else:
        # Step 2: Dual-Model Classification
        result = await classify_text(data.text)
        # Step 3: Populate Cache (24h TTL)
        await set_cached_classification(redis_client, data.text, result)

    category = result["category"]
    confidence = result["confidence"]
    raw_is_blocked = result.get("is_blocked", False)

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
            # Check blocked apps
            if data.context_app and data.context_app in (policy.blocked_apps or []):
                is_blocked = True

            # If AI flagged content, verify against policy category toggles & sensitivity
            if raw_is_blocked:
                # Check confidence threshold
                if confidence < policy.sensitivity_threshold:
                    is_blocked = False

                # Check category specific toggles
                if category == "VIOLENCE" and not policy.block_violence:
                    is_blocked = False
                elif category == "SEXUAL" and not policy.block_sexual:
                    is_blocked = False
                elif category == "CYBERBULLYING" and not policy.block_cyberbullying:
                    is_blocked = False
                elif category == "HATE_SPEECH" and not policy.block_hate_speech:
                    is_blocked = False

    # Step 5: Log Activity Event
    if child_uuid:
        from app.activity.models import ActivityEvent
        activity = ActivityEvent(
            child_id=child_uuid,
            app_name=data.context_app,
            url=None,
            content_snippet=data.text[:200],
            category=category,
            confidence=confidence,
            verdict="BLOCKED" if is_blocked else "ALLOWED",
        )
        db.add(activity)

    # Step 6: If content is blocked/unsafe, handle Alert & WhatsApp Dispatch
    if is_blocked and child_uuid:
        # Find the parent via Family relationship
        fm_result = await db.execute(
            select(FamilyMember, Family)
            .join(Family, FamilyMember.family_id == Family.id)
            .where(FamilyMember.child_id == child_uuid)
        )
        row = fm_result.first()

        if row:
            _, family = row
            parent_id = family.parent_id

            # Fetch parent details and notification preferences
            parent_result = await db.execute(
                select(User, NotificationPreferences)
                .outerjoin(NotificationPreferences, User.id == NotificationPreferences.user_id)
                .where(User.id == parent_id)
            )
            parent_row = parent_result.first()

            child_user = await db.get(User, child_uuid)
            child_name = child_user.full_name if child_user else "الطفل"

            # Create Alert record
            alert = Alert(
                child_id=child_uuid,
                parent_id=parent_id,
                content_snippet=data.text[:200],  # Masked/capped snippet
                category=category,
                confidence=confidence,
                verdict="BLOCKED",
                context_app=data.context_app,
                whatsapp_sent=False,
                web_push_sent=False,
            )
            db.add(alert)
            await db.flush()

            # Trigger WhatsApp Notification if parent configured
            if parent_row:
                _, prefs = parent_row
                if prefs and prefs.whatsapp_enabled and prefs.whatsapp_phone:
                    logger.info("Dispatching WhatsApp alert to %s for child %s", prefs.whatsapp_phone, child_name)
                    wa_success = await send_whatsapp_alert(
                        parent_phone=prefs.whatsapp_phone,
                        category=category,
                        child_name=child_name,
                        confidence=confidence,
                    )
                    if wa_success:
                        alert.whatsapp_sent = True

    await db.commit()

    return PredictResponse(
        verdict="BLOCKED" if is_blocked else "ALLOWED",
        category=category,
        confidence=confidence,
        is_blocked=is_blocked,
        execution_time_ms=result.get("execution_time_ms", 0.0),
        cached=cached,
    )


async def get_parent_alerts(
    db: AsyncSession,
    parent_id: uuid.UUID,
    category: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Alert]:
    """Retrieve filtered alerts list for the parent dashboard."""
    query = select(Alert).where(Alert.parent_id == parent_id)
    if category and category.upper() != "ALL":
        query = query.where(Alert.category == category.upper())

    query = query.order_by(desc(Alert.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())
