"""
Pydantic schemas for classification and alerts.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Arabic text snippet to classify")
    child_id: str = Field(..., description="UUID of the monitored child")
    context_app: str | None = Field(default=None, description="App where text was detected (e.g. WhatsApp, TikTok)")


class PredictResponse(BaseModel):
    verdict: str = Field(..., description="'BLOCKED' or 'ALLOWED'")
    category: str = Field(..., description="SAFE, CYBERBULLYING, SEXUAL, VIOLENCE, HATE_SPEECH")
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_blocked: bool
    execution_time_ms: float
    cached: bool = False


class AlertResponse(BaseModel):
    id: uuid.UUID
    child_id: uuid.UUID
    parent_id: uuid.UUID
    category: str
    content_snippet: str
    confidence: float
    verdict: str
    context_app: str | None
    whatsapp_sent: bool
    web_push_sent: bool
    created_at: datetime

    model_config = {"from_attributes": True}
