"""
Pydantic schemas for notification preferences and testing.
"""
from pydantic import BaseModel, Field, field_validator
import re


class NotificationPreferencesResponse(BaseModel):
    whatsapp_phone: str | None = None
    whatsapp_enabled: bool = True
    web_push_token: str | None = None
    web_push_enabled: bool = False

    model_config = {"from_attributes": True}


class UpdateNotificationPreferencesRequest(BaseModel):
    whatsapp_phone: str | None = Field(default=None, description="International E.164 phone format: 7 to 15 digits")
    whatsapp_enabled: bool = True
    web_push_token: str | None = None
    web_push_enabled: bool = False

    @field_validator("whatsapp_phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
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
            raise ValueError("رقم الواتساب يجب أن يكون بصيغة دولية صحيحة مع رمز الدولة (مثال: 966501234567 أو 201012345678)")
        return cleaned


class TestWhatsAppRequest(BaseModel):
    phone_number: str | None = None  # If None, use user's saved whatsapp_phone
    phone: str | None = None  # Alias for dashboard compatibility
    message: str | None = None


class TestWhatsAppResponse(BaseModel):
    success: bool
    message: str
    phone: str
