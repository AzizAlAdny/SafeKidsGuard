"""
Administrator Router: /admin/users, /admin/ai-metrics, /admin/flagged, /admin/settings.
Restricted strictly to users with role == 'admin' (FR10-FR13, UC-A1-UC-A6).
"""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service
from app.admin.schemas import (
    AdminAIMetricsResponse,
    AdminFlaggedItem,
    AdminFlaggedReviewRequest,
    AdminSystemSettingsResponse,
    AdminSystemSettingsUpdateRequest,
    AdminUserItem,
    AdminUserUpdateRequest,
)
from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Administration"],
    dependencies=[Depends(require_role("admin"))],
)


@router.get("/users", response_model=list[AdminUserItem])
async def get_users(
    role: str | None = Query(default=None, description="Filter by role: parent, child, admin"),
    search: str | None = Query(default=None, description="Search by email or name"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all platform users (FR10, UC-A1)."""
    return await service.list_all_users(db, role=role, search=search)


@router.patch("/users/{user_id}", response_model=AdminUserItem)
async def patch_user(
    user_id: uuid.UUID,
    data: AdminUserUpdateRequest,
    current_admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Activate/deactivate user or update role (FR10, UC-A1)."""
    return await service.update_user_account(db, user_id, data, current_admin)


@router.delete("/users/{user_id}", response_model=dict)
async def remove_user(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account and cascade family/session records (FR10, UC-A1)."""
    return await service.delete_user_account(db, user_id, current_admin)


@router.get("/ai-metrics", response_model=AdminAIMetricsResponse)
async def get_ai_metrics(db: AsyncSession = Depends(get_db)):
    """Retrieve AI classification performance metrics and model health (FR11, FR13, UC-A2, UC-A5)."""
    return await service.get_ai_metrics(db)


@router.get("/flagged", response_model=list[AdminFlaggedItem])
async def get_flagged_content(
    review_status: str | None = Query(default=None, description="Filter by PENDING, ACCESS_REQUESTED, APPROVED_FALSE_POSITIVE, CONFIRMED_THREAT"),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve flagged content snippets and child access appeals for review (FR11, UC-A4)."""
    return await service.list_flagged_content(db, review_status=review_status, limit=limit)


@router.patch("/flagged/{alert_id}", response_model=AdminFlaggedItem)
async def review_flagged_item(
    alert_id: uuid.UUID,
    data: AdminFlaggedReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """Approve a false-positive appeal or confirm threat status (FR11, UC-A4)."""
    return await service.review_flagged_alert(db, alert_id, data)


@router.get("/settings", response_model=AdminSystemSettingsResponse)
async def get_settings():
    """Retrieve global system and AI settings (FR12, UC-A6)."""
    return service.get_system_settings()


@router.put("/settings", response_model=AdminSystemSettingsResponse)
async def put_settings(data: AdminSystemSettingsUpdateRequest):
    """Update global AI confidence threshold and system settings (FR12, UC-A6)."""
    return service.update_system_settings(data)
