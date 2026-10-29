"""
Rate limiting configuration for Safe Kids Guard via slowapi.
Provides key-based rate limiting per client IP to prevent brute-force and DoS attacks.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Global limiter instance
# headers_enabled is set to False so FastAPI can return dict/Pydantic models without raw Response wrapping
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    headers_enabled=False,
    enabled=settings.APP_ENV != "test",
)
