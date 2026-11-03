"""
Notification Preferences and Testing Router.
Manages push notifications and alert delivery preferences.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import NotificationPreferences, User
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.alerts.schemas import (
    NotificationPreferencesResponse,
    TestNotificationRequest,
    TestNotificationResponse,
    UpdateNotificationPreferencesRequest,
)
from app.alerts.notifications import send_web_push_alert

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Get authenticated parent's notification preferences",
)
async def get_preferences(
    current_user: User = Depends(require_role("parent", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreferences(
            user_id=current_user.id,
            whatsapp_enabled=False,
            web_push_enabled=True,
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return prefs


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Update parent's notification channels (Web Push / Phone)",
)
async def update_preferences(
    data: UpdateNotificationPreferencesRequest,
    current_user: User = Depends(require_role("parent", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreferences(user_id=current_user.id)
        db.add(prefs)

    target_phone = data.phone_number or data.whatsapp_phone
    if target_phone is not None:
        prefs.whatsapp_phone = target_phone
    prefs.whatsapp_enabled = data.notifications_enabled

    if data.web_push_token is not None:
        prefs.web_push_token = data.web_push_token
    prefs.web_push_enabled = data.web_push_enabled

    await db.commit()
    await db.refresh(prefs)
    return prefs


@router.post(
    "/test-notification",
    response_model=TestNotificationResponse,
    summary="Send a test security notification to the parent",
)
@router.post(
    "/test-whatsapp",
    response_model=TestNotificationResponse,
    include_in_schema=False,
)
@router.post(
    "/whatsapp-test",
    response_model=TestNotificationResponse,
    include_in_schema=False,
)
async def test_notification(
    data: TestNotificationRequest,
    current_user: User = Depends(require_role("parent", "admin")),
    db: AsyncSession = Depends(get_db),
):
    target_phone = data.phone_number or data.phone or ""

    if not target_phone:
        result = await db.execute(
            select(NotificationPreferences).where(NotificationPreferences.user_id == current_user.id)
        )
        prefs = result.scalar_one_or_none()
        if prefs and prefs.whatsapp_phone:
            target_phone = prefs.whatsapp_phone

    # Send in-app / push test notification
    token = data.token or "test_web_push_token"
    await send_web_push_alert(
        web_push_token=token,
        child_name="تجريبي (Test Child)",
        category="CYBERBULLYING",
        confidence=0.95,
    )

    return TestNotificationResponse(
        success=True,
        message="تم إرسال إشعار التنبيه التجريبي بنجاح عبر نظام الإشعارات الفورية",
        phone=target_phone,
    )
