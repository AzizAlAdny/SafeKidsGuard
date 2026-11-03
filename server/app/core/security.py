"""
Security utilities: password hashing (bcrypt) and JWT encode/decode.
"""
import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ── Password ──────────────────────────────────────────────

def _prepare_password_bytes(password: str) -> bytes:
    """
    Prepare UTF-8 password bytes for bcrypt.
    For passwords exceeding bcrypt's 72-byte limit (e.g., >36 Arabic UTF-8 chars),
    pre-hash with SHA-256 hex digest (64 ASCII bytes) to prevent silent truncation.
    """
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        return hashlib.sha256(pwd_bytes).hexdigest().encode("ascii")
    return pwd_bytes


def hash_password(password: str) -> str:
    prepared = _prepare_password_bytes(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(prepared, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    prepared = _prepare_password_bytes(plain)
    hashed_bytes = hashed.encode("utf-8")
    try:
        return bcrypt.checkpw(prepared, hashed_bytes)
    except Exception:
        return False


# ── JWT ───────────────────────────────────────────────────

def create_access_token(user_id: str, role: str, family_id: str | None = None) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "role": role,
        "family_id": family_id,
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
