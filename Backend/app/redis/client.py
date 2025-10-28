from __future__ import annotations

import asyncio
from typing import Optional

import redis.asyncio as redis

from app.core.config import settings


_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    global _client
    if _client is None:
        if settings.REDIS_URL:
            url = settings.REDIS_URL
        else:
            # Trong Docker, sử dụng service name
            host = settings.REDIS_HOST or "redis"  # Service name
            port = settings.REDIS_PORT or 6379
            password = settings.REDIS_PASSWORD or None
            db_index = 0
            if password:
                url = f"redis://:{password}@{host}:{port}/{db_index}"
            else:
                url = f"redis://{host}:{port}/{db_index}"
        _client = redis.from_url(url, decode_responses=True)
    return _client


async def ping() -> bool:
    client = get_redis_client()
    try:
        return await client.ping()
    except Exception:
        return False


async def close():
    client = get_redis_client()
    await client.aclose()


