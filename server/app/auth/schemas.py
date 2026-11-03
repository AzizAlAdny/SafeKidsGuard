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
        description="Saudi format: 966XXXXXXXXX (no + prefix, 12 digits total)",
    )

    @field_validator("whatsapp_phone")
    @classmethod
    def validate_whatsapp(cls, v: str | None) -> str | None:
        if v is None:
            return v
        # Strip + if present
        v = v.lstrip("+").strip()
        # Validate Saudi format: 966 + 9 digits
        if not re.fullmatch(r"966\d{9}", v):
            raise ValueError(
                "WhatsApp phone must be in Saudi format: 966XXXXXXXXX (12 digits, no +)"
            )
        return v


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
