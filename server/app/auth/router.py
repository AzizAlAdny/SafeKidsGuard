"""
Auth routes: /auth/register, /auth/login, /auth/refresh, /auth/me, /auth/children
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.auth import service
from app.auth.models import User
from app.auth.schemas import (
    CreateChildRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new parent account.
    - Creates user, notification preferences (WhatsApp phone), and family record.
    - Returns JWT access + refresh token pair.
    """
    return await service.register_parent(db, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password. Returns JWT token pair."""
    return await service.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Rotate refresh token. Old token is immediately revoked."""
    return await service.refresh_access_token(db, data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/children",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("parent"))],
)
async def create_child(
    data: CreateChildRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a child account linked to the authenticated parent's family.
    Only parents can call this endpoint.
    """
    return await service.create_child_account(db, data, current_user)
