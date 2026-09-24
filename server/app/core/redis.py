"""
Redis connection pool — async client for classification caching.
"""
import redis.asyncio as aioredis

from app.core.config import settings

_redis_client: aioredis.Redis | None = None


async def init_redis() -> None:
    global _redis_client
    try:
        client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await client.ping()
        _redis_client = client
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Redis connection failed (%s); proceeding with in-memory/direct inference", e)
        _redis_client = None


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


def get_redis() -> aioredis.Redis | None:
    """FastAPI dependency — returns the shared Redis client, or None if unavailable."""
    return _redis_client
