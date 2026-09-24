"""
Policy models for parental control, app blocking, category toggles, and screen time.
"""
import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    parent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Age level: 1 = Young Child (6-11), 2 = Teen (12-17), 3 = Custom
    age_level: Mapped[int] = mapped_column(Integer, default=1)

    # Threat category toggles
    block_violence: Mapped[bool] = mapped_column(Boolean, default=True)
    block_sexual: Mapped[bool] = mapped_column(Boolean, default=True)
    block_cyberbullying: Mapped[bool] = mapped_column(Boolean, default=True)
    block_hate_speech: Mapped[bool] = mapped_column(Boolean, default=True)

    # Sensitivity threshold (0.50 to 0.95), default 0.75
    sensitivity_threshold: Mapped[float] = mapped_column(Float, default=0.75)

    # Blacklists & restrictions
    custom_blacklist_urls: Mapped[list[str]] = mapped_column(JSON, default=list)
    blocked_apps: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Screen time & Bedtime limits
    screen_time_daily_limit_mins: Mapped[int] = mapped_column(Integer, default=120)  # 2 hours
    bedtime_start: Mapped[str | None] = mapped_column(String(10), default="21:00", nullable=True)
    bedtime_end: Mapped[str | None] = mapped_column(String(10), default="06:00", nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    child = relationship("User", foreign_keys=[child_id])
    parent = relationship("User", foreign_keys=[parent_id])
