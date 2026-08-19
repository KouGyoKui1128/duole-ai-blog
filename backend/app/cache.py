import json
import logging
import os
from typing import Any

from fastapi.encoders import jsonable_encoder
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "").strip()
REDIS_DEFAULT_TTL = int(os.getenv("REDIS_DEFAULT_TTL", "300"))
_redis: Redis | None = None


async def _get_client() -> Redis | None:
    global _redis
    if not REDIS_URL:
        return None
    if _redis is None:
        _redis = Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1)
    try:
        await _redis.ping()
        return _redis
    except Exception:
        logger.warning("Redis unavailable; falling back to database", exc_info=True)
        return None


async def get_json(key: str) -> Any | None:
    client = await _get_client()
    if client is None:
        return None
    try:
        value = await client.get(key)
        return json.loads(value) if value else None
    except Exception:
        logger.warning("Redis read failed for key %s", key, exc_info=True)
        return None


async def set_json(key: str, value: Any, ttl: int = REDIS_DEFAULT_TTL) -> None:
    client = await _get_client()
    if client is None:
        return
    try:
        await client.set(key, json.dumps(jsonable_encoder(value), ensure_ascii=False), ex=ttl)
    except Exception:
        logger.warning("Redis write failed for key %s", key, exc_info=True)


async def delete_pattern(pattern: str) -> None:
    client = await _get_client()
    if client is None:
        return
    try:
        keys = [key async for key in client.scan_iter(match=pattern)]
        if keys:
            await client.delete(*keys)
    except Exception:
        logger.warning("Redis invalidation failed for pattern %s", pattern, exc_info=True)


async def close_cache() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
