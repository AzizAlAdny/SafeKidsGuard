"""
Activity router: query activity logs with filters and pagination.
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.schemas import (
    ActivityEventCreate,
    ActivityEventResponse,
    PaginatedActivityResponse,
)
from app.activity.service import get_parent_activities, log_activity
from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/activity", tags=["Activity Log"])


@router.get("", response_model=PaginatedActivityResponse)
async def get_activity_log(
    child_id: uuid.UUID | None = Query(None, description="Filter by child ID"),
    category: str | None = Query(None, description="Filter by threat category"),
    verdict: str | None = Query(None, description="Filter by verdict: ALLOWED or BLOCKED"),
    start_date: datetime | None = Query(None, description="Start date filter"),
    end_date: datetime | None = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve paginated activity logs for children linked to the authenticated parent.
    """
    items, total = await get_parent_activities(
        db=db,
        parent_id=current_user.id,
        child_id=child_id,
        category=category,
        verdict=verdict,
        start_date=start_date,
        end_date=end_date,
        page=page,
        size=size,
    )
    return PaginatedActivityResponse(
        items=[ActivityEventResponse(**it) for it in items],
        total=total,
        page=page,
        size=size,
    )


@router.post("", response_model=ActivityEventResponse, status_code=201)
async def log_activity_event(
    event: ActivityEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log an intercepted child activity event (sent from Android monitoring app).
    """
    created = await log_activity(
        db=db,
        child_id=event.child_id,
        category=event.category,
        confidence=event.confidence,
        verdict=event.verdict,
        content_snippet=event.content_snippet,
        app_name=event.app_name,
        url=event.url,
    )
    return ActivityEventResponse(
        id=created.id,
        child_id=created.child_id,
        app_name=created.app_name,
        url=created.url,
        content_snippet=created.content_snippet,
        category=created.category,
        confidence=created.confidence,
        verdict=created.verdict,
        timestamp=created.timestamp,
    )
