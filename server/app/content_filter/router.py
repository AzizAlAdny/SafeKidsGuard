"""
Content Moderation & Alerts Router.
Endpoints for real-time text prediction, alert history retrieval, and child access appeals.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.limiter import limiter
from app.core.redis import get_redis
from app.content_filter import service
from app.content_filter.schemas import (
    AccessAppealRequest,
    AlertResponse,
    PredictRequest,
    PredictResponse,
)
from app.policies.service import verify_parent_child_relationship

router = APIRouter(tags=["Content Moderation"])


@router.post(
    "/classification/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Real-time text content moderation (called by child app)",
)
@limiter.limit("120/minute")
async def predict_content(
    request: Request,
    data: PredictRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client=Depends(get_redis),
):
    """
    Classify Arabic text snippet using AraBERT v2 + CAMeLBERT dual-model engine.
    Applies Redis caching (SHA-256) and triggers automated WhatsApp alert if threat detected.
    Requires authentication and validates ownership of child_id.
    """
    try:
        child_uuid = uuid.UUID(data.child_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid child_id format. Must be a valid UUID.",
        )

    # Ownership validation (VULN-01 fix)
    if current_user.role == "child":
        if current_user.id != child_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Child device can only classify content for its own child_id",
            )
    elif current_user.role == "parent":
        is_owner = await verify_parent_child_relationship(db, current_user.id, child_uuid)
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to classify content for this child account",
            )
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return await service.classify_and_handle(db, redis_client, data, background_tasks)


@router.get(
    "/alerts",
    response_model=list[AlertResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve alert history for parent",
)
async def list_alerts(
    category: str | None = Query(default=None, description="Filter by category (CYBERBULLYING, SEXUAL, VIOLENCE, HATE_SPEECH)"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role("parent", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve history of threats detected across all linked child devices."""
    return await service.get_parent_alerts(
        db,
        parent_id=current_user.id,
        category=category,
        limit=limit,
        offset=offset,
        is_admin=(current_user.role == "admin"),
    )


@router.post(
    "/alerts/request-access",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a child access appeal / false-positive review request (UC-C5)",
)
async def request_access_appeal(
    data: AccessAppealRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow a child device to request parental review when content or an app is blocked."""
    return await service.submit_access_appeal(db, current_user, data)
