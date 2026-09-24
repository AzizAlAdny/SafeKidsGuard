"""
Redis classification cache layer.
Uses SHA-256 hash of preprocessed Arabic text with 24-hour TTL.
Provides fast <5ms classification for repeated messages.
"""
import hashlib
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 86400  # 24 hours


def get_cache_key(normalized_text: str) -> str:
    """Generate deterministic Redis cache key from SHA-256 of text."""
    digest = hashlib.sha256(normalized_text.strip().encode("utf-8")).hexdigest()
    return f"cache:classify:{digest}"


async def get_cached_classification(redis_client, normalized_text: str) -> dict[str, Any] | None:
    """
    Retrieve cached classification result if exists.
    Returns None if cache miss or Redis is unavailable.
    """
    if redis_client is None:
        return None

    try:
        key = get_cache_key(normalized_text)
        cached = await redis_client.get(key)
        if cached:
            logger.debug("Redis cache HIT for key %s", key)
            return json.loads(cached)
    except Exception as e:
        logger.warning("Redis cache read error (proceeding without cache): %s", e)

    return None


async def set_cached_classification(
    redis_client, normalized_text: str, result: dict[str, Any], ttl: int = CACHE_TTL_SECONDS
) -> None:
    """
    Store classification result in Redis with 24h TTL.
    Fails silently if Redis is unavailable.
    """
    if redis_client is None:
        return

    try:
        key = get_cache_key(normalized_text)
        await redis_client.set(key, json.dumps(result), ex=ttl)
        logger.debug("Redis cache SET for key %s (TTL=%ds)", key, ttl)
    except Exception as e:
        logger.warning("Redis cache write error: %s", e)
