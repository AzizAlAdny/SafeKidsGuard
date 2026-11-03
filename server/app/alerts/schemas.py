"""
Pydantic schemas for notification preferences and testing.
"""
from pydantic import BaseModel, Field, model_validator
import re


def _clean_phone(v: str | None) -> str | None:
    if v is None or v == "":
        return None
    cleaned = re.sub(r"[\s\-+()]", "", v)
    if cleaned.startswith("00"):
        cleaned = cleaned[2:]
    if cleaned.startswith("05") and len(cleaned) == 10:
        cleaned = "966" + cleaned[1:]
    elif cleaned.startswith("5") and len(cleaned) == 9:
        cleaned = "966" + cleaned
    if not re.fullmatch(r"\d{7,15}", cleaned):
        raise ValueError("رقم الهاتف يجب أن يكون بصيغة دولية صحيحة مع رمز الدولة (مثال: 966501234567 أو 201012345678)")
    return cleaned


class NotificationPreferencesResponse(BaseModel):
    phone_number: str | None = None
    notifications_enabled: bool = True
    web_push_token: str | None = None
    web_push_enabled: bool = False
    # Aliases for backward compatibility
    whatsapp_phone: str | None = None
    whatsapp_enabled: bool = True

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def sync_aliases(cls, data: any) -> any:
        if isinstance(data, dict):
            phone = data.get("phone_number") or data.get("whatsapp_phone")
            enabled = data.get("notifications_enabled") if data.get("notifications_enabled") is not None else data.get("whatsapp_enabled", True)
            data["phone_number"] = phone
            data["whatsapp_phone"] = phone
            data["notifications_enabled"] = enabled
            data["whatsapp_enabled"] = enabled
        elif hasattr(data, "whatsapp_phone"):
            # SQLAlchemy model instance
            phone = getattr(data, "whatsapp_phone", None)
            enabled = getattr(data, "whatsapp_enabled", True)
            return {
                "phone_number": phone,
                "whatsapp_phone": phone,
                "notifications_enabled": enabled,
                "whatsapp_enabled": enabled,
                "web_push_token": getattr(data, "web_push_token", None),
                "web_push_enabled": getattr(data, "web_push_enabled", False),
            }
        return data


class UpdateNotificationPreferencesRequest(BaseModel):
    phone_number: str | None = Field(default=None, description="International E.164 phone format: 7 to 15 digits")
    notifications_enabled: bool = True
    web_push_token: str | None = None
    web_push_enabled: bool = False
    whatsapp_phone: str | None = None
    whatsapp_enabled: bool | None = None

    @model_validator(mode="after")
    def validate_and_sync(self):
        # Sync phone_number and whatsapp_phone
        target_phone = self.phone_number or self.whatsapp_phone
        if target_phone:
            cleaned = _clean_phone(target_phone)
            self.phone_number = cleaned
            self.whatsapp_phone = cleaned

        if self.whatsapp_enabled is not None:
            self.notifications_enabled = self.whatsapp_enabled
        return self


class TestNotificationRequest(BaseModel):
    token: str | None = None
    phone_number: str | None = None
    phone: str | None = None
    message: str | None = None


class TestNotificationResponse(BaseModel):
    success: bool
    message: str
    phone: str = ""


# Aliases for backward compatibility
TestWhatsAppRequest = TestNotificationRequest
TestWhatsAppResponse = TestNotificationResponse
