"""
OmniStore AI — Rate Limiting Middleware.
In-memory token bucket per client IP + path.
"""
from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable):
        ident = request.client.host if request.client else "anon"
        now = time.time()
        bucket = self._buckets[ident]
        # Prune old entries
        self._buckets[ident] = [t for t in bucket if now - t < self.window_seconds]
        if len(self._buckets[ident]) >= self.max_requests:
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
            )
        self._buckets[ident].append(now)
        return await call_next(request)
