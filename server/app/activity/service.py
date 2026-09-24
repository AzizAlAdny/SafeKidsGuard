"""
Business logic for logging and querying child activity events.
"""
import uuid
from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent
from app.auth.models import Family, FamilyMember, User


async def log_activity(
    db: AsyncSession,
    child_id: uuid.UUID,
    category: str,
    confidence: float,
    verdict: str,
    content_snippet: str,
    app_name: str | None = None,
    url: str | None = None,
) -> ActivityEvent:
    """Save an activity event to the database (privacy: snippet truncated to 200 chars)."""
    truncated_snippet = content_snippet[:200] if content_snippet else ""
    event = ActivityEvent(
        child_id=child_id,
        app_name=app_name,
        url=url,
        content_snippet=truncated_snippet,
        category=category,
        confidence=confidence,
        verdict=verdict,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def get_parent_activities(
    db: AsyncSession,
    parent_id: uuid.UUID,
    child_id: uuid.UUID | None = None,
    category: str | None = None,
    verdict: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    """Retrieve activity log for children belonging to this parent."""
    # Find all children of this parent
    children_subquery = (
        select(FamilyMember.child_id)
        .join(Family, Family.id == FamilyMember.family_id)
        .where(Family.parent_id == parent_id)
    )

    base_query = (
        select(ActivityEvent, User.full_name.label("child_name"))
        .join(User, User.id == ActivityEvent.child_id)
        .where(ActivityEvent.child_id.in_(children_subquery))
    )

    if child_id:
        base_query = base_query.where(ActivityEvent.child_id == child_id)
    if category:
        base_query = base_query.where(ActivityEvent.category == category)
    if verdict:
        base_query = base_query.where(ActivityEvent.verdict == verdict)
    if start_date:
        base_query = base_query.where(ActivityEvent.timestamp >= start_date)
    if end_date:
        base_query = base_query.where(ActivityEvent.timestamp <= end_date)

    # Count total
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Paginate and order by newest first
    stmt = (
        base_query.order_by(ActivityEvent.timestamp.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = []
    for event, child_name in rows:
        items.append({
            "id": event.id,
            "child_id": event.child_id,
            "child_name": child_name,
            "app_name": event.app_name,
            "url": event.url,
            "content_snippet": event.content_snippet,
            "category": event.category,
            "confidence": event.confidence,
            "verdict": event.verdict,
            "timestamp": event.timestamp,
        })

    return items, total_count
