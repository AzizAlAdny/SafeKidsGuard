"""
Content Moderation & Alerts Router.
Endpoints for real-time text prediction and alert history retrieval.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.redis import get_redis
from app.content_filter import service
from app.content_filter.schemas import AlertResponse, PredictRequest, PredictResponse

router = APIRouter(tags=["Content Moderation"])


@router.post(
    "/classification/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Real-time text content moderation (called by child app)",
)
async def predict_content(
    data: PredictRequest,
    db: AsyncSession = Depends(get_db),
    redis_client=Depends(get_redis),
):
    """
    Classify Arabic text snippet using AraBERT v2 + CAMeLBERT dual-model engine.
    Applies Redis caching (SHA-256) and triggers automated WhatsApp alert if threat detected.
    """
    return await service.classify_and_handle(db, redis_client, data)


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
        db, parent_id=current_user.id, category=category, limit=limit, offset=offset
    )
