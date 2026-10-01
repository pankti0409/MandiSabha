"""Open-Meteo weather tool."""
from __future__ import annotations

from datetime import datetime, timezone

import httpx
import structlog

from app.config import settings
from app.tools.registry import ToolResult

log = structlog.get_logger()

CACHE_TTL_SECONDS = 3 * 3600  # 3 hours


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_weather(lat: float, lon: float) -> ToolResult:
    """Fetch 5-day forecast from Open-Meteo. Returns null on failure — never fabricates."""
    from app.db import AsyncSessionLocal
    from app.models import ApiCache

    cache_key = f"weather:{round(lat,3)}:{round(lon,3)}"

    async with AsyncSessionLocal() as db:
        cached = await db.get(ApiCache, cache_key)
        if cached:
            age = (_now() - cached.fetched_at.replace(tzinfo=timezone.utc)).total_seconds()
            if age < CACHE_TTL_SECONDS:
                return ToolResult(ok=True, data=cached.payload, source="cache", fetched_at=cached.fetched_at)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.open_meteo_base_url}/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
                    "forecast_days": 5,
                    "timezone": "auto",
                },
            )
            resp.raise_for_status()
            data = resp.json()

    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        log.warning("weather_fetch_failed", error=str(exc), lat=lat, lon=lon)
        # Try stale cache
        async with AsyncSessionLocal() as db:
            cached = await db.get(ApiCache, cache_key)
            if cached:
                return ToolResult(
                    ok=True, data=cached.payload, source="cache",
                    fetched_at=cached.fetched_at, stale=True,
                    warnings=["Weather data from stale cache — may not reflect current conditions"],
                )
        return ToolResult(ok=False, error=f"Weather unavailable: {exc}")

    # Cache the result
    async with AsyncSessionLocal() as db:
        entry = ApiCache(key=cache_key, payload=data, fetched_at=_now(), ttl_seconds=CACHE_TTL_SECONDS)
        await db.merge(entry)
        await db.commit()

    return ToolResult(ok=True, data=data, source="live", fetched_at=_now())
