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
    role: Literal["parent", "child"] = "parent"
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


class CreateChildRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    nickname: str | None = None


# ── Response schemas ──────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
