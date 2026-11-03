"""
Auth routes: /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me, /auth/children, /auth/pair-device
"""
import uuid
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.limiter import limiter
from app.auth import service
from app.auth.models import User
from app.auth.schemas import (
    CreateChildRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    PairDeviceRequest,
    PairDeviceResponse,
    PairingPinResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UnpairDeviceRequest,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("15/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new parent account.
    - Creates user, notification preferences (WhatsApp phone), and family record.
    - Returns JWT access + refresh token pair.
    """
    return await service.register_parent(db, data)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password. Returns JWT token pair."""
    return await service.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Rotate refresh token. Old token is immediately revoked."""
    return await service.refresh_access_token(db, data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: LogoutRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke refresh tokens for the authenticated user."""
    refresh_tok = data.refresh_token if data else None
    return await service.logout_user(db, current_user, refresh_tok)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/children",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("parent", "admin"))],
)
async def create_child(
    data: CreateChildRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a child account linked to the authenticated parent's family.
    Only parents (or admins) can call this endpoint.
    """
    return await service.create_child_account(db, data, current_user)


@router.get(
    "/children",
    response_model=dict,
    dependencies=[Depends(require_role("parent", "admin"))],
)
async def list_children(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all children linked to the authenticated parent."""
    return await service.get_parent_children(db, current_user)


@router.post(
    "/children/{child_id}/pairing-pin",
    response_model=PairingPinResponse,
    dependencies=[Depends(require_role("parent", "admin"))],
)
async def create_pairing_pin(
    child_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new 6-digit pairing PIN for linking a child's Android device."""
    return await service.generate_pairing_pin(db, current_user, child_id)


@router.post("/pair-device", response_model=PairDeviceResponse)
@limiter.limit("10/minute")
async def pair_device(
    request: Request,
    data: PairDeviceRequest,
    db: AsyncSession = Depends(get_db),
):
    """Redeem a 6-digit pairing PIN from the Android child app and issue a child JWT session."""
    return await service.pair_child_device(db, data.pairing_pin)


@router.post("/unpair-device", response_model=MessageResponse)
async def unpair_device(
    data: UnpairDeviceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify parent password before allowing a child device to unpair."""
    return await service.unpair_child_device(db, current_user, data.parent_password)
