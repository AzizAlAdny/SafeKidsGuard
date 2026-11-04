"""
Business logic for logging and querying child activity events.
"""
import uuid
from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityEvent
from app.auth.models import Family, FamilyMember, User
from app.content_filter.models import Alert


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
    """Save an activity event to the database and create a parent Alert if the event was BLOCKED."""
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

    # Also persist an Alert record when a local policy violation (BLOCKED_APP, BLACKLISTED_URL, etc.) blocks access
    if verdict == "BLOCKED":
        fm_stmt = (
            select(Family.parent_id)
            .join(FamilyMember, FamilyMember.family_id == Family.id)
            .where(FamilyMember.child_id == child_id)
        )
        parent_res = await db.execute(fm_stmt)
        parent_id = parent_res.scalar_one_or_none()
        if parent_id:
            alert = Alert(
                child_id=child_id,
                parent_id=parent_id,
                content_snippet=truncated_snippet or f"تم الحظر التلقائي ({category})",
                category=category,
                confidence=confidence,
                verdict="BLOCKED",
                context_app=app_name or url,
                whatsapp_sent=False,
                web_push_sent=True,
                review_status="PENDING",
            )
            db.add(alert)

    await db.commit()
    await db.refresh(event)
    return event


async def get_parent_activities(
    db: AsyncSession,
    parent_id: uuid.UUID,
    child_id: uuid.UUID | None = None,
    category: str | None = None,
    verdict: str | None = None,
    search: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    size: int = 20,
    is_admin: bool = False,
) -> tuple[list[dict], int]:
    """Retrieve activity log for children belonging to this parent (or all children for admin)."""
    base_query = (
        select(ActivityEvent, User.full_name.label("child_name"))
        .join(User, User.id == ActivityEvent.child_id)
    )

    if not is_admin:
        children_subquery = (
            select(FamilyMember.child_id)
            .join(Family, Family.id == FamilyMember.family_id)
            .where(Family.parent_id == parent_id)
        )
        base_query = base_query.where(ActivityEvent.child_id.in_(children_subquery))

    if child_id:
        base_query = base_query.where(ActivityEvent.child_id == child_id)
    if category:
        base_query = base_query.where(ActivityEvent.category == category)
    if verdict:
        base_query = base_query.where(ActivityEvent.verdict == verdict)
    if search:
        pat = f"%{search.strip()}%"
        base_query = base_query.where(
            ActivityEvent.content_snippet.ilike(pat)
            | ActivityEvent.app_name.ilike(pat)
            | User.full_name.ilike(pat)
        )
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
