"""
Policies router: get and update policy rules per child.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.policies.schemas import PolicyResponse, PolicyUpdate
from app.policies.service import (
    get_or_create_policy,
    update_policy,
    verify_parent_child_relationship,
)

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("/{child_id}", response_model=PolicyResponse)
async def get_policy_endpoint(
    child_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the active policy for a specific child.
    Accessible by:
    - The child account itself (e.g. Android app fetching active restrictions).
    - The child's parent.
    - Admin.
    """
    if current_user.role == "child":
        if current_user.id != child_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Child account can only access their own policy",
            )
        return await get_or_create_policy(db, child_id)

    elif current_user.role == "parent":
        is_owner = await verify_parent_child_relationship(db, current_user.id, child_id)
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access policies for this child",
            )
        return await get_or_create_policy(db, child_id, current_user.id)

    elif current_user.role == "admin":
        return await get_or_create_policy(db, child_id)

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.put("/{child_id}", response_model=PolicyResponse)
async def update_policy_endpoint(
    child_id: uuid.UUID,
    data: PolicyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update policy rules for a child account.
    Restricted to the parent of the child (or admin).
    """
    if current_user.role not in ["parent", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents or admins can configure safety policies",
        )

    return await update_policy(
        db=db,
        child_id=child_id,
        parent_id=current_user.id,
        update_data=data,
    )
