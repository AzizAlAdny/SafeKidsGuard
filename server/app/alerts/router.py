"""
Notification Preferences and WhatsApp Testing Router.
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
    TestWhatsAppRequest,
    TestWhatsAppResponse,
    UpdateNotificationPreferencesRequest,
)
from app.alerts.whatsapp import send_whatsapp_alert

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
            whatsapp_enabled=True,
            web_push_enabled=False,
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return prefs


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Update parent's notification channels (WhatsApp phone / Web Push)",
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

    if data.whatsapp_phone is not None:
        prefs.whatsapp_phone = data.whatsapp_phone
    prefs.whatsapp_enabled = data.whatsapp_enabled

    if data.web_push_token is not None:
        prefs.web_push_token = data.web_push_token
    prefs.web_push_enabled = data.web_push_enabled

    await db.commit()
    await db.refresh(prefs)
    return prefs


@router.post(
    "/test-whatsapp",
    response_model=TestWhatsAppResponse,
    summary="Send a test Arabic alert template via WhatsApp Business API",
)
async def test_whatsapp(
    data: TestWhatsAppRequest,
    current_user: User = Depends(require_role("parent", "admin")),
    db: AsyncSession = Depends(get_db),
):
    target_phone = data.phone_number

    if not target_phone:
        result = await db.execute(
            select(NotificationPreferences).where(NotificationPreferences.user_id == current_user.id)
        )
        prefs = result.scalar_one_or_none()
        if not prefs or not prefs.whatsapp_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لم يتم تسجيل رقم واتساب في إعدادات الإشعارات الخاصة بك",
            )
        target_phone = prefs.whatsapp_phone

    success = await send_whatsapp_alert(
        parent_phone=target_phone,
        category="CYBERBULLYING",
        child_name="تجريبي (Test)",
        confidence=0.95,
    )

    if success:
        return TestWhatsAppResponse(
            success=True,
            message="تم إرسال رسالة التنبيه التجريبية بنجاح عبر WhatsApp Business API",
            phone=target_phone,
        )
    else:
        return TestWhatsAppResponse(
            success=False,
            message="لم يتم إرسال الرسالة — يرجى التأكد من ضبط بيانات اعتماد Meta API (WA_PHONE_NUMBER_ID و WA_ACCESS_TOKEN)",
            phone=target_phone,
        )
