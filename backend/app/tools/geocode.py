"""Geocoding tool — Nominatim with 1 req/s throttle."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional

import httpx
import structlog

from app.config import settings
from app.tools.registry import ToolResult

log = structlog.get_logger()

# Global lock for 1 req/s Nominatim throttle
_nominatim_lock = asyncio.Lock()
_last_request_time: float = 0.0


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _check_seed_fallback(place: str) -> Optional[ToolResult]:
    from app.db import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            from app.services.mandi_directory import find_mandi_by_name
            mandi = await find_mandi_by_name(db, place)
            if mandi and mandi.lat is not None and mandi.lon is not None:
                return ToolResult(
                    ok=True,
                    data={
                        "lat": float(mandi.lat),
                        "lon": float(mandi.lon),
                        "display_name": f"{mandi.name}, {mandi.district}, {mandi.state}",
                        "precision": "mandi_seed",
                    },
                    source="local",
                    fetched_at=_now(),
                    warnings=["Geocoding fell back to curated mandi seed directory"],
                )
    except Exception as exc:
        log.warning("mandi_seed_fallback_error", error=str(exc))
    return None


async def geocode(place: str, country: str = "in") -> ToolResult:
    """Geocode a place name using Nominatim. Throttled to ≤1 req/s, results cached indefinitely."""
    global _last_request_time
    import time
    from app.db import AsyncSessionLocal
    from app.models import ApiCache

    cache_key = f"geocode:{place.lower().strip()}:{country}"

    async with AsyncSessionLocal() as db:
        cached = await db.get(ApiCache, cache_key)
        if cached:
            if cached.payload.get("miss"):
                # Cached miss — don't retry for 24h
                age = (_now() - cached.fetched_at.replace(tzinfo=timezone.utc)).total_seconds()
                if age < 86400:
                    return ToolResult(ok=False, error=f"Place not found (cached miss): {place}", source="cache")
            else:
                return ToolResult(ok=True, data=cached.payload, source="cache", fetched_at=cached.fetched_at)

    # Throttle to 1 req/s
    async with _nominatim_lock:
        now_mono = time.monotonic()
        elapsed = now_mono - _last_request_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        _last_request_time = time.monotonic()

        try:
            async with httpx.AsyncClient(
                headers={"User-Agent": settings.nominatim_user_agent},
                timeout=10,
            ) as client:
                resp = await client.get(
                    f"{settings.nominatim_base_url}/search",
                    params={"format": "jsonv2", "limit": 1, "q": place, "countrycodes": country},
                )
                resp.raise_for_status()
                results = resp.json()

        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            log.warning("nominatim_failed", error=str(exc), place=place)
            # Try seed fallback on network failure
            seed_res = await _check_seed_fallback(place)
            if seed_res:
                return seed_res
            return ToolResult(ok=False, error=f"Geocoding failed: {exc}")

    if not results:
        seed_res = await _check_seed_fallback(place)
        if seed_res:
            return seed_res

        # Cache the miss
        async with AsyncSessionLocal() as db:
            miss_entry = ApiCache(key=cache_key, payload={"miss": True}, fetched_at=_now(), ttl_seconds=86400)
            await db.merge(miss_entry)
            await db.commit()
        return ToolResult(ok=False, error=f"Place not found: {place}")

    r = results[0]
    data = {
        "lat": float(r["lat"]),
        "lon": float(r["lon"]),
        "display_name": r.get("display_name", place),
        "precision": r.get("type", "unknown"),
    }

    async with AsyncSessionLocal() as db:
        entry = ApiCache(key=cache_key, payload=data, fetched_at=_now(), ttl_seconds=365 * 86400)
        await db.merge(entry)
        await db.commit()

    return ToolResult(ok=True, data=data, source="live", fetched_at=_now())


async def _check_reverse_seed_fallback(lat: float, lon: float) -> Optional[ToolResult]:
    from app.db import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            from app.services.mandi_directory import find_nearby_mandis_in_directory
            mandis = await find_nearby_mandis_in_directory(db, lat, lon, radius_km=2500)
            if mandis:
                closest = mandis[0]
                return ToolResult(
                    ok=True,
                    data={
                        "village": closest.name,
                        "district": closest.district,
                        "state": closest.state,
                        "display_name": f"{closest.name}, {closest.district}",
                        "lat": lat,
                        "lon": lon,
                        "precision": "mandi_seed_proximity",
                    },
                    source="local",
                    fetched_at=_now(),
                    warnings=["Reverse geocoding fell back to nearest curated mandi"],
                )
    except Exception as exc:
        log.warning("reverse_mandi_seed_fallback_error", error=str(exc))
    return None


async def reverse_geocode(lat: float, lon: float) -> ToolResult:
    """Reverse geocode latitude and longitude to address components using Nominatim."""
    global _last_request_time
    import time
    from app.db import AsyncSessionLocal
    from app.models import ApiCache

    cache_key = f"reverse_geocode:{round(lat, 4)}:{round(lon, 4)}"

    async with AsyncSessionLocal() as db:
        cached = await db.get(ApiCache, cache_key)
        if cached:
            if cached.payload.get("miss"):
                age = (_now() - cached.fetched_at.replace(tzinfo=timezone.utc)).total_seconds()
                if age < 86400:
                    return ToolResult(ok=False, error=f"Location not found for coords: {lat}, {lon}", source="cache")
            else:
                return ToolResult(ok=True, data=cached.payload, source="cache", fetched_at=cached.fetched_at)

    # Throttle to 1 req/s
    async with _nominatim_lock:
        now_mono = time.monotonic()
        elapsed = now_mono - _last_request_time
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)
        _last_request_time = time.monotonic()

        try:
            async with httpx.AsyncClient(
                headers={"User-Agent": settings.nominatim_user_agent},
                timeout=10,
            ) as client:
                resp = await client.get(
                    f"{settings.nominatim_base_url}/reverse",
                    params={"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 14, "addressdetails": 1},
                )
                resp.raise_for_status()
                res_json = resp.json()
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            log.warning("nominatim_reverse_failed", error=str(exc), lat=lat, lon=lon)
            seed_res = await _check_reverse_seed_fallback(lat, lon)
            if seed_res:
                return seed_res
            return ToolResult(ok=False, error=f"Reverse geocoding failed: {exc}")

    if not res_json or "error" in res_json:
        seed_res = await _check_reverse_seed_fallback(lat, lon)
        if seed_res:
            return seed_res
        return ToolResult(ok=False, error=res_json.get("error", "Location not found"))

    addr = res_json.get("address", {})
    village = (
        addr.get("village")
        or addr.get("suburb")
        or addr.get("town")
        or addr.get("city")
        or addr.get("hamlet")
        or addr.get("municipality")
        or addr.get("county")
        or ""
    )
    district = addr.get("state_district") or addr.get("district") or addr.get("county") or ""
    state = addr.get("state") or ""
    postcode = addr.get("postcode")
    raw_display = res_json.get("display_name", "")

    if village and district:
        display_name = f"{village}, {district}"
    elif village and state:
        display_name = f"{village}, {state}"
    elif district and state:
        display_name = f"{district}, {state}"
    else:
        display_name = raw_display.split(",")[0].strip() if raw_display else f"{lat:.3f}, {lon:.3f}"

    data = {
        "village": village,
        "district": district,
        "state": state,
        "display_name": display_name,
        "lat": lat,
        "lon": lon,
        "postcode": postcode,
        "precision": res_json.get("type", "reverse_geocode"),
    }

    async with AsyncSessionLocal() as db:
        entry = ApiCache(key=cache_key, payload=data, fetched_at=_now(), ttl_seconds=30 * 86400)
        await db.merge(entry)
        await db.commit()

    return ToolResult(ok=True, data=data, source="live", fetched_at=_now())

