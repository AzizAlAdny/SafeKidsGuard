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
    whatsapp_phone: str | None = Field(default=None, description="Saudi format: 966XXXXXXXXX")
    whatsapp_enabled: bool = True
    web_push_token: str | None = None
    web_push_enabled: bool = False

    @field_validator("whatsapp_phone")
    @classmethod
    def validate_saudi_phone(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        cleaned = re.sub(r"[\s\-+]", "", v)
        if cleaned.startswith("05"):
            cleaned = "966" + cleaned[1:]
        elif cleaned.startswith("5"):
            cleaned = "966" + cleaned
        if not re.match(r"^9665\d{8}$", cleaned):
            raise ValueError("رقم الواتساب يجب أن يكون بصيغة سعودية صحيحة (مثال: 966501234567)")
        return cleaned


class TestWhatsAppRequest(BaseModel):
    phone_number: str | None = None  # If None, use user's saved whatsapp_phone


class TestWhatsAppResponse(BaseModel):
    success: bool
    message: str
    phone: str
