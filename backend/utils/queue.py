"""Optional Redis + RQ helper for background jobs and caching.

This module is designed to be resilient: if Redis or rq are not available
the functions are no-ops and the application falls back to in-memory behavior.
"""
from __future__ import annotations

import os
import json
from typing import Any

_redis = None
_queue = None

try:
    import redis
    from rq import Queue
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    _redis = redis.Redis.from_url(REDIS_URL)
    _queue = Queue("alexandria", connection=_redis)
except Exception:
    _redis = None
    _queue = None


def is_enabled() -> bool:
    return _redis is not None and _queue is not None


def cache_get(key: str) -> Any:
    if not _redis:
        return None
    try:
        v = _redis.get(key)
        if not v:
            return None
        return json.loads(v)
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    if not _redis:
        return False
    try:
        _redis.set(key, json.dumps(value), ex=ttl)
        return True
    except Exception:
        return False


def enqueue_job(func, *args, **kwargs):
    """Enqueue a job if queue is available. Returns job or None."""
    if not _queue:
        return None
    try:
        job = _queue.enqueue(func, *args, **kwargs)
        return job
    except Exception:
        return None
