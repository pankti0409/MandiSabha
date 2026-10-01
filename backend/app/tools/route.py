"""OSRM routing tool with haversine fallback."""
from __future__ import annotations

import asyncio
import math
from datetime import datetime, timezone
from typing import Optional

import httpx
import structlog

from app.config import settings
from app.tools.registry import ToolResult

log = structlog.get_logger()

CACHE_TTL_SECONDS = 7 * 86400  # 7 days

# Global throttle: ≤1 req/s
_osrm_semaphore = asyncio.Semaphore(1)
_last_osrm_time: float = 0.0


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _cache_key(origin_lat, origin_lon, dest_lat, dest_lon) -> str:
    return f"route:{round(origin_lat,2)},{round(origin_lon,2)}->{round(dest_lat,2)},{round(dest_lon,2)}"


async def get_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> ToolResult:
    """Get driving route via OSRM. Falls back to haversine×1.3 estimate."""
    global _last_osrm_time
    import time
    from app.db import AsyncSessionLocal
    from app.models import ApiCache

    cache_key = _cache_key(origin_lat, origin_lon, dest_lat, dest_lon)

    async with AsyncSessionLocal() as db:
        cached = await db.get(ApiCache, cache_key)
        if cached:
            age = (_now() - cached.fetched_at.replace(tzinfo=timezone.utc)).total_seconds()
            if age < CACHE_TTL_SECONDS:
                return ToolResult(ok=True, data=cached.payload, source="cache", fetched_at=cached.fetched_at)

    async with _osrm_semaphore:
        now_mono = time.monotonic()
        elapsed = now_mono - _last_osrm_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        _last_osrm_time = time.monotonic()

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                url = (
                    f"{settings.osrm_base_url}/route/v1/driving/"
                    f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
                    "?overview=simplified&geometries=geojson"
                )
                resp = await client.get(url)
                resp.raise_for_status()
                body = resp.json()

                if body.get("code") != "Ok" or not body.get("routes"):
                    raise ValueError("OSRM returned no routes")

                route = body["routes"][0]
                distance_km = round(route["distance"] / 1000, 1)
                duration_min = round(route["duration"] / 60, 0)
                geometry = route.get("geometry", {"type": "LineString", "coordinates": []})

                data = {
                    "distance_km": distance_km,
                    "duration_min": duration_min,
                    "geometry": geometry,
                    "method": "osrm",
                }

                async with AsyncSessionLocal() as db:
                    entry = ApiCache(key=cache_key, payload=data, fetched_at=_now(), ttl_seconds=CACHE_TTL_SECONDS)
                    await db.merge(entry)
                    await db.commit()

                return ToolResult(ok=True, data=data, source="live", fetched_at=_now())

        except (httpx.HTTPError, httpx.TimeoutException, ValueError) as exc:
            log.warning("osrm_failed", error=str(exc))

    # Haversine fallback
    straight_km = _haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
    est_km = round(straight_km * 1.3, 1)
    est_min = round(est_km / 50 * 60)  # assume 50 km/h average

    data = {
        "distance_km": est_km,
        "duration_min": est_min,
        "geometry": {
            "type": "LineString",
            "coordinates": [[origin_lon, origin_lat], [dest_lon, dest_lat]],
        },
        "method": "estimate",
    }

    return ToolResult(
        ok=True,
        data=data,
        source="estimate",
        warnings=["OSRM unavailable; distance is haversine×1.3 estimate, not driving route"],
    )
