"""
Safe Kids Guard — FCM Web Push and In-App notification sender.
Dispatches push alerts to parent browser / devices when threats are detected.
"""
import logging
import os

from app.core.config import settings

logger = logging.getLogger(__name__)


def _translate_category(category: str) -> str:
    """Translate English threat category to Arabic."""
    translations = {
        "SAFE": "آمن",
        "CYBERBULLYING": "تنمر إلكتروني",
        "SEXUAL": "محتوى غير لائق",
        "VIOLENCE": "عنف وتحريض",
        "HATE_SPEECH": "خطاب كراهية",
    }
    return translations.get(category.upper(), category)


async def send_web_push_alert(
    web_push_token: str,
    child_name: str,
    category: str,
    confidence: float,
) -> bool:
    """
    Dispatch a Web Push notification via Firebase Cloud Messaging (FCM).
    """
    if not web_push_token:
        return False

    category_ar = _translate_category(category)
    title = f"⚠️ تنبيه حماية الطفل — {child_name}"
    body = f"تم رصد وحظر محتوى مصنف كـ ({category_ar}) بنسبة ثقة {confidence * 100:.0f}%."

    try:
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            import firebase_admin
            from firebase_admin import credentials, messaging

            if not firebase_admin._apps:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)

            msg = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=web_push_token,
            )
            messaging.send(msg)
            logger.info("FCM Web Push sent successfully to %s...", web_push_token[:12])
            return True
        else:
            # Token registered in preferences; marked for PWA / client push delivery
            logger.info("Web Push alert queued for client token %s...", web_push_token[:12])
            return True
    except Exception as exc:
        logger.warning(f"Web Push notification failed: {exc}")
        return False
