"""
Business logic for Policy retrieval and updates.
"""
import uuid
from datetime import UTC, datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Family, FamilyMember, User
from app.policies.models import Policy
from app.policies.schemas import PolicyUpdate


async def verify_parent_child_relationship(
    db: AsyncSession, parent_id: uuid.UUID, child_id: uuid.UUID
) -> bool:
    """Check if the parent owns the family containing this child."""
    stmt = (
        select(FamilyMember)
        .join(Family, Family.id == FamilyMember.family_id)
        .where(Family.parent_id == parent_id, FamilyMember.child_id == child_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def get_or_create_policy(
    db: AsyncSession, child_id: uuid.UUID, parent_id: uuid.UUID | None = None
) -> Policy:
    """Retrieve policy for a child, or initialize a default policy if none exists."""
    stmt = select(Policy).where(Policy.child_id == child_id)
    result = await db.execute(stmt)
    policy = result.scalar_one_or_none()

    if not policy:
        # If parent_id was not provided, find the parent via family relationship
        if not parent_id:
            parent_stmt = (
                select(Family.parent_id)
                .join(FamilyMember, FamilyMember.family_id == Family.id)
                .where(FamilyMember.child_id == child_id)
            )
            p_res = await db.execute(parent_stmt)
            parent_id = p_res.scalar_one_or_none()
            if not parent_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent not found for this child",
                )

        policy = Policy(
            child_id=child_id,
            parent_id=parent_id,
            age_level=1,
            block_violence=True,
            block_sexual=True,
            block_cyberbullying=True,
            block_hate_speech=True,
            sensitivity_threshold=0.75,
            custom_blacklist_urls=[],
            blocked_apps=[],
            screen_time_daily_limit_mins=120,
            bedtime_start="21:00",
            bedtime_end="06:00",
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)

    return policy


async def update_policy(
    db: AsyncSession,
    child_id: uuid.UUID,
    parent_id: uuid.UUID,
    update_data: PolicyUpdate,
) -> Policy:
    """Update child policy after confirming parent authorization."""
    is_authorized = await verify_parent_child_relationship(db, parent_id, child_id)
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify policies for this child account",
        )

    policy = await get_or_create_policy(db, child_id, parent_id)

    # Apply updates
    data_dict = update_data.model_dump(exclude_unset=True)
    for field, val in data_dict.items():
        if val is not None:
            setattr(policy, field, val)

    policy.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(policy)
    return policy
