"""
Pydantic schemas for the Administrator module (FR10-FR13, UC-A1-UC-A6).
"""
import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class AdminUserItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class AdminUserUpdateRequest(BaseModel):
    is_active: bool | None = None
    role: Literal["parent", "child", "admin"] | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=255)


class AdminAIMetricsResponse(BaseModel):
    transformers_enabled: bool
    models_loaded: bool
    arabert_model: str
    camelbert_model: str
    confidence_threshold: float
    total_predictions: int
    total_blocked: int
    total_allowed: int
    average_confidence: float
    false_positives_approved: int
    pending_reviews: int
    category_distribution: dict[str, int]


class AdminFlaggedItem(BaseModel):
    id: uuid.UUID
    child_id: uuid.UUID
    child_name: str | None = None
    parent_id: uuid.UUID
    category: str
    content_snippet: str
    confidence: float
    verdict: str
    context_app: str | None = None
    review_status: str
    access_request_reason: str | None = None
    created_at: datetime


class AdminFlaggedReviewRequest(BaseModel):
    review_status: Literal["APPROVED_FALSE_POSITIVE", "CONFIRMED_THREAT", "DISMISSED"]


class AdminSystemSettingsResponse(BaseModel):
    ai_confidence_threshold: float
    ai_enable_transformers: bool
    arabert_model_name: str
    camelbert_model_name: str
    jwt_access_token_expire_minutes: int
    app_env: str


class AdminSystemSettingsUpdateRequest(BaseModel):
    ai_confidence_threshold: float | None = Field(default=None, ge=0.50, le=0.99)
    ai_enable_transformers: bool | None = None
