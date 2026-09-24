"""
Pydantic schemas for Policy requests and responses.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PolicyBase(BaseModel):
    age_level: int = Field(default=1, ge=1, le=3, description="1: Young, 2: Teen, 3: Custom")
    block_violence: bool = Field(default=True)
    block_sexual: bool = Field(default=True)
    block_cyberbullying: bool = Field(default=True)
    block_hate_speech: bool = Field(default=True)
    sensitivity_threshold: float = Field(
        default=0.75, ge=0.5, le=0.99, description="Confidence threshold to trigger blocking"
    )
    custom_blacklist_urls: list[str] = Field(default_factory=list)
    blocked_apps: list[str] = Field(default_factory=list)
    screen_time_daily_limit_mins: int = Field(
        default=120, ge=0, le=1440, description="Daily limit in minutes (0 = unlimited)"
    )
    bedtime_start: str | None = Field(default="21:00", max_length=10)
    bedtime_end: str | None = Field(default="06:00", max_length=10)


class PolicyUpdate(BaseModel):
    age_level: int | None = Field(default=None, ge=1, le=3)
    block_violence: bool | None = None
    block_sexual: bool | None = None
    block_cyberbullying: bool | None = None
    block_hate_speech: bool | None = None
    sensitivity_threshold: float | None = Field(default=None, ge=0.5, le=0.99)
    custom_blacklist_urls: list[str] | None = None
    blocked_apps: list[str] | None = None
    screen_time_daily_limit_mins: int | None = Field(default=None, ge=0, le=1440)
    bedtime_start: str | None = None
    bedtime_end: str | None = None


class PolicyResponse(PolicyBase):
    id: uuid.UUID
    child_id: uuid.UUID
    parent_id: uuid.UUID
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
