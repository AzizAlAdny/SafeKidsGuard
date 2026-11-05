"""
Pydantic schemas for Activity Events.
"""
import uuid
from datetime import UTC, datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActivityEventCreate(BaseModel):
    child_id: uuid.UUID
    app_name: str | None = Field(default=None, max_length=100)
    url: str | None = Field(default=None, max_length=500)
    content_snippet: str = Field(..., max_length=500)
    category: str = Field(..., max_length=50)
    confidence: float = Field(..., ge=0.0, le=1.0)
    verdict: str = Field(default="ALLOWED")


class ActivityEventResponse(BaseModel):
    id: uuid.UUID
    child_id: uuid.UUID
    child_name: str | None = None
    app_name: str | None = None
    url: str | None = None
    content_snippet: str
    category: str
    confidence: float
    verdict: str
    timestamp: datetime

    @field_validator("timestamp", mode="after")
    @classmethod
    def ensure_utc_timezone(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=UTC)
        return v

    model_config = ConfigDict(from_attributes=True)


class PaginatedActivityResponse(BaseModel):
    items: list[ActivityEventResponse]
    total: int
    page: int
    size: int


class BatchActivityRequest(BaseModel):
    events: list[ActivityEventCreate] = Field(..., min_length=1, max_length=100)
