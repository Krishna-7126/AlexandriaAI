from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..utils import cache
import time


class SimpleRateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 30, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period

    async def dispatch(self, request: Request, call_next):
        # Use client host as key
        client = request.client.host if request.client else "unknown"
        key = f"rl:{client}"
        now = int(time.time())
        data = cache.get(key)
        if data:
            try:
                timestamp, count = data.split("|")
                timestamp = int(timestamp)
                count = int(count)
            except Exception:
                timestamp = now
                count = 0
        else:
            timestamp = now
            count = 0

        if now - timestamp >= self.period:
            # reset window
            timestamp = now
            count = 0

        if count >= self.calls:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        count += 1
        cache.set(key, f"{timestamp}|{count}", ttl=self.period)
        response = await call_next(request)
        return response
