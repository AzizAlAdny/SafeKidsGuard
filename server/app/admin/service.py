"""
Business logic for the Administrator module (FR10-FR13, UC-A1-UC-A6).
"""
import uuid
from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent
from app.ai_engine.model import is_models_loaded
from app.auth.models import Family, FamilyMember, User
from app.content_filter.models import Alert
from app.core.config import settings
from app.admin.schemas import (
    AdminAIMetricsResponse,
    AdminFlaggedItem,
    AdminFlaggedReviewRequest,
    AdminSystemSettingsResponse,
    AdminSystemSettingsUpdateRequest,
    AdminUserItem,
    AdminUserUpdateRequest,
)


async def list_all_users(
    db: AsyncSession,
    role: str | None = None,
    search: str | None = None,
) -> list[AdminUserItem]:
    """List all users in the platform with optional role and search filters."""
    stmt = select(User).order_by(desc(User.created_at))
    if role:
        stmt = stmt.where(User.role == role)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where((User.email.ilike(pattern)) | (User.full_name.ilike(pattern)))

    res = await db.execute(stmt)
    users = res.scalars().all()
    return [AdminUserItem.model_validate(u) for u in users]


async def update_user_account(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: AdminUserUpdateRequest,
    current_admin: User,
) -> AdminUserItem:
    """Activate/deactivate user or update role/full_name."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_admin.id and data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot deactivate their own account",
        )

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role
    if data.full_name is not None:
        user.full_name = data.full_name

    await db.commit()
    await db.refresh(user)
    return AdminUserItem.model_validate(user)


async def delete_user_account(
    db: AsyncSession,
    user_id: uuid.UUID,
    current_admin: User,
) -> dict:
    """Delete a user account and cascade associated records."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account",
        )

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully", "deleted_user_id": str(user_id)}


async def get_ai_metrics(db: AsyncSession) -> AdminAIMetricsResponse:
    """Aggregate system-wide AI classification and moderation metrics."""
    events_res = await db.execute(select(ActivityEvent))
    events = events_res.scalars().all()

    total_predictions = len(events)
    total_blocked = sum(1 for e in events if e.verdict == "BLOCKED")
    total_allowed = total_predictions - total_blocked
    avg_conf = (
        round(sum(e.confidence for e in events) / total_predictions, 4)
        if total_predictions > 0
        else 0.98
    )

    cat_dist: dict[str, int] = {}
    for e in events:
        cat_dist[e.category] = cat_dist.get(e.category, 0) + 1

    alerts_res = await db.execute(select(Alert))
    alerts = alerts_res.scalars().all()
    false_positives = sum(1 for a in alerts if a.review_status == "APPROVED_FALSE_POSITIVE")
    pending_reviews = sum(
        1 for a in alerts if a.review_status in ("PENDING", "ACCESS_REQUESTED")
    )

    return AdminAIMetricsResponse(
        transformers_enabled=settings.AI_ENABLE_TRANSFORMERS,
        models_loaded=is_models_loaded(),
        arabert_model=settings.ARABERT_MODEL_NAME,
        camelbert_model=settings.CAMELBERT_MODEL_NAME,
        confidence_threshold=settings.AI_CONFIDENCE_THRESHOLD,
        total_predictions=total_predictions,
        total_blocked=total_blocked,
        total_allowed=total_allowed,
        average_confidence=avg_conf,
        false_positives_approved=false_positives,
        pending_reviews=pending_reviews,
        category_distribution=cat_dist,
    )


async def list_flagged_content(
    db: AsyncSession,
    review_status: str | None = None,
    limit: int = 50,
) -> list[AdminFlaggedItem]:
    """List flagged/blocked alerts and child access requests for admin review."""
    stmt = (
        select(Alert, User.full_name.label("child_name"))
        .outerjoin(User, User.id == Alert.child_id)
        .order_by(desc(Alert.created_at))
        .limit(limit)
    )
    if review_status and review_status.upper() != "ALL":
        stmt = stmt.where(Alert.review_status == review_status.upper())

    res = await db.execute(stmt)
    items: list[AdminFlaggedItem] = []
    for alert, child_name in res.all():
        items.append(
            AdminFlaggedItem(
                id=alert.id,
                child_id=alert.child_id,
                child_name=child_name or "طفل",
                parent_id=alert.parent_id,
                category=alert.category,
                content_snippet=alert.content_snippet,
                confidence=alert.confidence,
                verdict=alert.verdict,
                context_app=alert.context_app,
                review_status=alert.review_status,
                access_request_reason=alert.access_request_reason,
                created_at=alert.created_at,
            )
        )
    return items


async def review_flagged_alert(
    db: AsyncSession,
    alert_id: uuid.UUID,
    data: AdminFlaggedReviewRequest,
) -> AdminFlaggedItem:
    """Approve false-positive or confirm threat on a flagged alert."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.review_status = data.review_status
    if data.review_status == "APPROVED_FALSE_POSITIVE":
        alert.verdict = "ALLOWED"
    elif data.review_status == "CONFIRMED_THREAT":
        alert.verdict = "BLOCKED"

    await db.commit()
    await db.refresh(alert)

    child_user = await db.get(User, alert.child_id)
    return AdminFlaggedItem(
        id=alert.id,
        child_id=alert.child_id,
        child_name=child_user.full_name if child_user else "طفل",
        parent_id=alert.parent_id,
        category=alert.category,
        content_snippet=alert.content_snippet,
        confidence=alert.confidence,
        verdict=alert.verdict,
        context_app=alert.context_app,
        review_status=alert.review_status,
        access_request_reason=alert.access_request_reason,
        created_at=alert.created_at,
    )


def get_system_settings() -> AdminSystemSettingsResponse:
    """Return current runtime AI and security configuration."""
    return AdminSystemSettingsResponse(
        ai_confidence_threshold=settings.AI_CONFIDENCE_THRESHOLD,
        ai_enable_transformers=settings.AI_ENABLE_TRANSFORMERS,
        arabert_model_name=settings.ARABERT_MODEL_NAME,
        camelbert_model_name=settings.CAMELBERT_MODEL_NAME,
        jwt_access_token_expire_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        app_env=settings.APP_ENV,
    )


def update_system_settings(data: AdminSystemSettingsUpdateRequest) -> AdminSystemSettingsResponse:
    """Update runtime AI threshold and transformer configuration."""
    if data.ai_confidence_threshold is not None:
        settings.AI_CONFIDENCE_THRESHOLD = data.ai_confidence_threshold
    if data.ai_enable_transformers is not None:
        settings.AI_ENABLE_TRANSFORMERS = data.ai_enable_transformers
    return get_system_settings()
