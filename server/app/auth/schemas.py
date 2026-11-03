"""
Pydantic schemas for Auth: request bodies and response models.
"""
import re
import uuid
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request schemas ───────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: Literal["parent"] = "parent"
    whatsapp_phone: str | None = Field(
        default=None,
        description="International E.164 phone format: 7 to 15 digits without +, e.g. 966501234567, 201012345678",
    )

    @field_validator("whatsapp_phone")
    @classmethod
    def validate_whatsapp(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        # Clean formatting characters
        cleaned = re.sub(r"[\s\-+()]", "", v)
        if cleaned.startswith("00"):
            cleaned = cleaned[2:]
        # Convenience for Saudi numbers
        if cleaned.startswith("05") and len(cleaned) == 10:
            cleaned = "966" + cleaned[1:]
        elif cleaned.startswith("5") and len(cleaned) == 9:
            cleaned = "966" + cleaned

        # E.164 international standard: 7 to 15 digits
        if not re.fullmatch(r"\d{7,15}", cleaned):
            raise ValueError(
                "WhatsApp phone must be a valid international number with country code (e.g. 966501234567, 201012345678, 971501234567)"
            )
        return cleaned


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class CreateChildRequest(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    nickname: str | None = None
    age: int | None = Field(default=None, ge=3, le=18)


class PairDeviceRequest(BaseModel):
    pairing_pin: str = Field(..., min_length=6, max_length=12, description="6-digit pairing PIN (e.g. 123456 or 123-456)")


class UnpairDeviceRequest(BaseModel):
    parent_password: str = Field(..., min_length=1, description="Parent account password required to unpair child device")


# ── Response schemas ──────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool = True

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class PairingPinResponse(BaseModel):
    child_id: uuid.UUID
    pairing_pin: str
    formatted_pin: str
    expires_at: str


class PairDeviceResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    child_id: uuid.UUID
    child_name: str
    family_id: uuid.UUID


class MessageResponse(BaseModel):
    message: str
