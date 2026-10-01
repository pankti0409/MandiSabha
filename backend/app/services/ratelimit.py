"""In-memory sliding-window rate limiter (per-process; document Redis upgrade path)."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Optional

# Store: {bucket_key: deque of timestamps}
_windows: dict[str, deque] = defaultdict(deque)


def check_rate_limit(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Check rate limit. Returns (allowed, retry_after_seconds)."""
    now = time.monotonic()
    cutoff = now - window_seconds
    q = _windows[key]

    # Prune old entries
    while q and q[0] < cutoff:
        q.popleft()

    if len(q) >= limit:
        retry_after = int(q[0] - cutoff) + 1
        return False, retry_after

    q.append(now)
    return True, 0


def check_otp_rate_limits(mobile: str, ip: Optional[str]) -> tuple[bool, str, int]:
    """Check OTP-specific rate limits. Returns (allowed, bucket_name, retry_after)."""
    from app.config import settings

    allowed, retry = check_rate_limit(
        f"otp:phone:{mobile}", settings.rl_otp_per_phone_per_10min, 600
    )
    if not allowed:
        return False, "phone", retry

    if ip:
        allowed, retry = check_rate_limit(
            f"otp:ip:{ip}", settings.rl_otp_per_ip_per_10min, 600
        )
        if not allowed:
            return False, "ip", retry

    return True, "", 0
