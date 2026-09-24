"""
Safe Kids Guard — WhatsApp Business API notification sender.
Uses Meta Cloud API via httpx.AsyncClient.
"""
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_whatsapp_alert(
    parent_phone: str,
    child_name: str,
    category: str,
    confidence: float,
) -> bool:
    """
    Send a pre-approved Arabic template alert to the parent via WhatsApp.

    Template: safe_kids_alert (registered in Meta Business Dashboard)
    Body: ⚠️ تنبيه: تم رصد محتوى {category} على جهاز {child_name} بنسبة ثقة {confidence}%

    Args:
        parent_phone: Saudi format without +, e.g. "966501234567"
        child_name: Child's display name
        category: Content category (e.g. CYBERBULLYING, SEXUAL)
        confidence: Model confidence score (0.0-1.0)

    Returns:
        True if message accepted by Meta API, False otherwise
    """
    if not settings.WA_PHONE_NUMBER_ID or not settings.WA_ACCESS_TOKEN:
        logger.warning("WhatsApp credentials not configured — skipping WhatsApp notification")
        return False

    url = f"https://graph.facebook.com/{settings.WA_API_VERSION}/{settings.WA_PHONE_NUMBER_ID}/messages"

    payload = {
        "messaging_product": "whatsapp",
        "to": parent_phone,
        "type": "template",
        "template": {
            "name": "safe_kids_alert",
            "language": {"code": "ar"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": _translate_category(category)},
                    {"type": "text", "text": child_name},
                    {"type": "text", "text": f"{confidence * 100:.0f}"},
                ],
            }],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.WA_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if resp.status_code == 200:
            logger.info(f"WhatsApp alert sent to {parent_phone[:6]}***")
            return True
        else:
            logger.error(f"WhatsApp API error {resp.status_code}: {resp.text}")
            return False
    except httpx.TimeoutException:
        logger.error("WhatsApp API request timed out")
        return False
    except Exception as exc:
        logger.error(f"WhatsApp send failed: {exc}")
        return False


async def send_whatsapp_daily_report(
    parent_phone: str,
    child_name: str,
    safe_count: int,
    blocked_count: int,
) -> bool:
    """Send daily report template: safe_kids_daily."""
    if not settings.WA_PHONE_NUMBER_ID or not settings.WA_ACCESS_TOKEN:
        return False

    url = f"https://graph.facebook.com/{settings.WA_API_VERSION}/{settings.WA_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": parent_phone,
        "type": "template",
        "template": {
            "name": "safe_kids_daily",
            "language": {"code": "ar"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": child_name},
                    {"type": "text", "text": str(safe_count)},
                    {"type": "text", "text": str(blocked_count)},
                ],
            }],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.WA_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        return resp.status_code == 200
    except Exception as exc:
        logger.error(f"WhatsApp daily report failed: {exc}")
        return False


def _translate_category(category: str) -> str:
    """Translate English category to Arabic for the template."""
    translations = {
        "SAFE": "آمن",
        "CYBERBULLYING": "تنمر إلكتروني",
        "SEXUAL": "محتوى جنسي",
        "VIOLENCE": "عنف",
        "HATE_SPEECH": "خطاب كراهية",
    }
    return translations.get(category.upper(), category)
