"""Cache abstraction: prefer Redis if available, otherwise use in-memory dict with TTL."""
import time
import threading
from typing import Optional

_store = {}
_lock = threading.Lock()
_redis = None
_redis_checked = False


def _get_redis():
    global _redis, _redis_checked
    if _redis_checked:
        return _redis
    _redis_checked = True
    try:
        import redis
        _redis = redis.from_url("redis://localhost:6379/0")
    except Exception:
        _redis = None
    return _redis


def set(key: str, value: str, ttl: Optional[int] = None):
    r = _get_redis()
    if r:
        try:
            if ttl:
                r.setex(key, ttl, value)
            else:
                r.set(key, value)
            return True
        except Exception:
            pass

    with _lock:
        expire_at = time.time() + ttl if ttl else None
        _store[key] = (value, expire_at)
    return True


def get(key: str) -> Optional[str]:
    r = _get_redis()
    if r:
        try:
            v = r.get(key)
            return v.decode("utf-8") if v is not None else None
        except Exception:
            pass

    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        value, expire_at = entry
        if expire_at and time.time() > expire_at:
            del _store[key]
            return None
        return value


def delete(key: str):
    r = _get_redis()
    if r:
        try:
            r.delete(key)
            return True
        except Exception:
            pass
    with _lock:
        _store.pop(key, None)
    return True
