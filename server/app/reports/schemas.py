"""
Pydantic schemas for Reports and Analytics.
"""
from datetime import date
from pydantic import BaseModel, Field


class CategoryCount(BaseModel):
    category: str
    count: int
    label_ar: str


class DailyTrend(BaseModel):
    date: str
    total: int
    blocked: int
    allowed: int


class ReportSummaryResponse(BaseModel):
    child_id: str | None = None
    child_name: str | None = None
    start_date: str
    end_date: str
    total_events: int
    blocked_events: int
    allowed_events: int
    safety_score: float = Field(..., description="Percentage of safe/allowed interactions (0-100%)")
    threat_breakdown: list[CategoryCount]
    daily_trends: list[DailyTrend]
