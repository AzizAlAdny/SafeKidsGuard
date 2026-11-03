"""
Auth business logic: register, login, refresh, logout, create child account, and device pairing.
"""
import hashlib
import secrets
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
    MessageResponse,
    PairDeviceResponse,
    PairingPinResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


def _hash_token(token: str) -> str:
    """Store refresh token as SHA-256 hash — never in plaintext."""
    return hashlib.sha256(token.encode()).hexdigest()


def _generate_six_digit_pin() -> str:
    """Generate a cryptographically random 6-digit pairing PIN."""
    return f"{secrets.randbelow(900000) + 100000:06d}"


async def _resolve_user_family_id(db: AsyncSession, user: User) -> str | None:
    """Resolve the family UUID associated with a parent or child user."""
    if user.role == "parent":
        res = await db.execute(select(Family.id).where(Family.parent_id == user.id))
        fam_id = res.scalar_one_or_none()
        return str(fam_id) if fam_id else None
    elif user.role == "child":
        res = await db.execute(select(FamilyMember.family_id).where(FamilyMember.child_id == user.id))
        fam_id = res.scalar_one_or_none()
        return str(fam_id) if fam_id else None
    return None


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
    await db.flush()

    # Issue tokens with family_id claim
    access_token = create_access_token(str(user.id), user.role, family_id=str(family.id))
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

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    family_id = await _resolve_user_family_id(db, user)
    access_token = create_access_token(str(user.id), user.role, family_id=family_id)
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
    if not user or not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    family_id = await _resolve_user_family_id(db, user)
    new_access = create_access_token(str(user.id), user.role, family_id=family_id)
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


async def logout_user(db: AsyncSession, user: User, refresh_token: str | None = None) -> MessageResponse:
    """Revoke refresh tokens for the authenticated user on logout."""
    if refresh_token:
        token_hash = _hash_token(refresh_token)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.token_hash == token_hash,
            )
        )
        token_row = result.scalar_one_or_none()
        if token_row:
            token_row.is_revoked = True
    else:
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.is_revoked == False,  # noqa: E712
            )
        )
        for token_row in result.scalars().all():
            token_row.is_revoked = True

    await db.commit()
    return MessageResponse(message="Logged out successfully")


async def create_child_account(
    db: AsyncSession, data: CreateChildRequest, parent: User
) -> UserResponse:
    """Create a child account linked to the authenticated parent's family."""
    child_email = data.email or f"child_{uuid.uuid4().hex[:10]}@safekidsguard.internal"
    child_password = data.password or secrets.token_urlsafe(16)

    existing = await db.execute(select(User).where(User.email == child_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    child = User(
        email=child_email,
        password_hash=hash_password(child_password),
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

    initial_pin = _generate_six_digit_pin()
    pin_expiry = datetime.now(UTC) + timedelta(minutes=30)

    db.add(
        FamilyMember(
            family_id=family.id,
            child_id=child.id,
            nickname=data.nickname or data.full_name,
            pairing_pin=initial_pin,
            pairing_pin_expires_at=pin_expiry,
            is_paired=False,
        )
    )
    await db.commit()
    await db.refresh(child)

    return UserResponse.model_validate(child)


async def get_parent_children(db: AsyncSession, parent: User) -> dict:
    """Retrieve all child accounts linked to the authenticated parent."""
    query = (
        select(
            User,
            FamilyMember.nickname,
            FamilyMember.pairing_pin,
            FamilyMember.pairing_pin_expires_at,
            FamilyMember.is_paired,
        )
        .join(FamilyMember, User.id == FamilyMember.child_id)
        .join(Family, Family.id == FamilyMember.family_id)
    )
    if parent.role != "admin":
        query = query.where(Family.parent_id == parent.id)

    result = await db.execute(query)
    children = []
    now = datetime.now(UTC)
    for user, nickname, pin, pin_exp, is_paired in result.all():
        active_pin = None
        if pin and pin_exp:
            exp_utc = pin_exp.replace(tzinfo=UTC) if pin_exp.tzinfo is None else pin_exp
            if exp_utc > now:
                active_pin = f"{pin[:3]}-{pin[3:]}"
        children.append({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or "طفل",
            "nickname": nickname,
            "role": user.role,
            "is_paired": bool(is_paired),
            "pairing_pin": active_pin,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        })
    return {"children": children}


async def generate_pairing_pin(
    db: AsyncSession, parent: User, child_id: uuid.UUID
) -> PairingPinResponse:
    """Generate a fresh 6-digit pairing PIN (valid for 15 minutes) for a child device."""
    stmt = (
        select(FamilyMember)
        .join(Family, Family.id == FamilyMember.family_id)
        .where(FamilyMember.child_id == child_id)
    )
    if parent.role != "admin":
        stmt = stmt.where(Family.parent_id == parent.id)

    res = await db.execute(stmt)
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to generate a pairing PIN for this child",
        )

    # Ensure uniqueness across active PINs
    for _ in range(5):
        pin = _generate_six_digit_pin()
        dup = await db.execute(select(FamilyMember).where(FamilyMember.pairing_pin == pin))
        if not dup.scalar_one_or_none():
            break

    expires_at = datetime.now(UTC) + timedelta(minutes=15)
    member.pairing_pin = pin
    member.pairing_pin_expires_at = expires_at
    await db.commit()

    return PairingPinResponse(
        child_id=child_id,
        pairing_pin=pin,
        formatted_pin=f"{pin[:3]}-{pin[3:]}",
        expires_at=expires_at.isoformat(),
    )


async def pair_child_device(db: AsyncSession, raw_pin: str) -> PairDeviceResponse:
    """Validate a 6-digit pairing PIN and return a real child JWT session."""
    cleaned_pin = raw_pin.replace("-", "").replace(" ", "").strip()
    if len(cleaned_pin) != 6 or not cleaned_pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pairing PIN format. Must be 6 digits.",
        )

    stmt = (
        select(FamilyMember, User)
        .join(User, User.id == FamilyMember.child_id)
        .where(FamilyMember.pairing_pin == cleaned_pin)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired pairing PIN",
        )

    member, child_user = row
    now = datetime.now(UTC)
    if not member.pairing_pin_expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Pairing PIN expired")

    exp_utc = (
        member.pairing_pin_expires_at.replace(tzinfo=UTC)
        if member.pairing_pin_expires_at.tzinfo is None
        else member.pairing_pin_expires_at
    )
    if exp_utc < now:
        member.pairing_pin = None
        member.pairing_pin_expires_at = None
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Pairing PIN expired")

    # Mark paired and consume one-time PIN
    member.is_paired = True
    member.pairing_pin = None
    member.pairing_pin_expires_at = None

    access_token = create_access_token(
        str(child_user.id), child_user.role, family_id=str(member.family_id)
    )
    refresh_token = create_refresh_token(str(child_user.id))

    db.add(
        RefreshToken(
            user_id=child_user.id,
            token_hash=_hash_token(refresh_token),
            expires_at=now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    await db.commit()

    return PairDeviceResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        child_id=child_user.id,
        child_name=child_user.full_name or member.nickname or "الطفل",
        family_id=member.family_id,
    )


async def unpair_child_device(
    db: AsyncSession, current_user: User, parent_password: str
) -> MessageResponse:
    """Verify parent password before allowing a child device to unpair."""
    if current_user.role == "child":
        stmt = (
            select(User, FamilyMember)
            .join(Family, Family.parent_id == User.id)
            .join(FamilyMember, FamilyMember.family_id == Family.id)
            .where(FamilyMember.child_id == current_user.id)
        )
        res = await db.execute(stmt)
        row = res.first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent account not found")
        parent_user, member = row
        if not verify_password(parent_password, parent_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid parent password. Cannot unpair device.",
            )
        member.is_paired = False
        await logout_user(db, current_user)
        return MessageResponse(message="Device unpaired successfully")

    elif current_user.role in ("parent", "admin"):
        if not verify_password(parent_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password",
            )
        return MessageResponse(message="Device unpaired successfully")

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def delete_parent_child(
    db: AsyncSession,
    current_user: User,
    child_id: uuid.UUID,
) -> dict:
    """Delete a child account linked to the authenticated parent (or admin)."""
    if current_user.role != "admin":
        stmt = (
            select(FamilyMember)
            .join(Family, Family.id == FamilyMember.family_id)
            .where(Family.parent_id == current_user.id, FamilyMember.child_id == child_id)
        )
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this child account",
            )

    child = await db.get(User, child_id)
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child account not found",
        )

    await db.delete(child)
    await db.commit()
    return {"message": "Child account deleted successfully", "deleted_child_id": str(child_id)}

