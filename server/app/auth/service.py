"""
Auth business logic: register, login, refresh, create child account.
"""
import hashlib
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.auth.models import Family, FamilyMember, NotificationPreferences, RefreshToken, User
from app.auth.schemas import (
    CreateChildRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


def _hash_token(token: str) -> str:
    """Store refresh token as SHA-256 hash — never in plaintext."""
    return hashlib.sha256(token.encode()).hexdigest()


async def register_parent(db: AsyncSession, data: RegisterRequest) -> TokenResponse:
    """Register a new parent account with optional WhatsApp phone."""
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role="parent",
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()  # Get user.id without committing

    # Create notification preferences (with WhatsApp if provided)
    prefs = NotificationPreferences(
        user_id=user.id,
        whatsapp_phone=data.whatsapp_phone,
        whatsapp_enabled=data.whatsapp_phone is not None,
    )
    db.add(prefs)

    # Create family
    family = Family(parent_id=user.id, name=f"عائلة {data.full_name}")
    db.add(family)

    # Issue tokens
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    ))

    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    """Authenticate user and return JWT token pair."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Rotate refresh token and return new token pair."""
    from app.core.security import decode_token
    from jose import JWTError

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = payload["sub"]
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    token_hash = _hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found or revoked")

    expires_at = stored.expires_at.replace(tzinfo=UTC) if stored.expires_at.tzinfo is None else stored.expires_at
    if expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    # Revoke old token
    stored.is_revoked = True

    # Get user
    user_id_val = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    user = await db.get(User, user_id_val)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(str(user.id), user.role)
    new_refresh = create_refresh_token(str(user.id))

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(new_refresh),
        expires_at=datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    await db.commit()

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


async def create_child_account(
    db: AsyncSession, data: CreateChildRequest, parent: User
) -> UserResponse:
    """Create a child account linked to the authenticated parent's family."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    child = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role="child",
        full_name=data.full_name,
    )
    db.add(child)
    await db.flush()

    # Link to parent's family
    family_result = await db.execute(select(Family).where(Family.parent_id == parent.id))
    family = family_result.scalar_one_or_none()
    if not family:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent family not found")

    db.add(FamilyMember(family_id=family.id, child_id=child.id, nickname=data.nickname))
    await db.commit()
    await db.refresh(child)

    return UserResponse.model_validate(child)
