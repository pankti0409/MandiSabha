"""Mandi directory service — loads and matches mandis from the DB."""
from __future__ import annotations

import math
import re
from typing import Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Mandi

log = structlog.get_logger()


def _normalize_name(name: str) -> str:
    """Normalize mandi name for fuzzy matching."""
    # Lowercase, strip APMC/Market Yard/etc., remove brackets
    n = name.lower()
    n = re.sub(r"\(.*?\)", "", n)
    for suffix in ["apmc", "market yard", "mandi", "sabzi mandi", "vegetable market",
                   "regulated market", "krishi upaj mandi"]:
        n = n.replace(suffix, "")
    n = re.sub(r"\s+", " ", n).strip()
    return n


def _similarity(a: str, b: str) -> float:
    """Simple character overlap ratio for fuzzy matching."""
    a, b = set(a.replace(" ", "")), set(b.replace(" ", ""))
    if not a or not b:
        return 0.0
    return len(a & b) / max(len(a), len(b))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line distance in km between two coordinates."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def find_mandi_by_name(db: AsyncSession, raw_name: str, state: str | None = None) -> Optional[Mandi]:
    """Try to match a mandi name from the directory."""
    query = select(Mandi)
    if state:
        query = query.where(Mandi.state == state)
    result = await db.execute(query)
    all_mandis = result.scalars().all()

    norm_raw = _normalize_name(raw_name)

    best: Optional[Mandi] = None
    best_score = 0.0

    for mandi in all_mandis:
        # Check name
        score = _similarity(norm_raw, _normalize_name(mandi.name))
        # Check aliases
        for alias in (mandi.aliases or []):
            s = _similarity(norm_raw, _normalize_name(str(alias)))
            score = max(score, s)

        if score > best_score:
            best_score = score
            best = mandi

    THRESHOLD = 0.5
    if best and best_score >= THRESHOLD:
        return best

    if best_score < THRESHOLD:
        log.warning("mandi_unmatched", raw_name=raw_name, best_score=best_score)
    return None


async def find_nearby_mandis_in_directory(
    db: AsyncSession,
    origin_lat: float,
    origin_lon: float,
    radius_km: float,
    must_include_id: Optional[str] = None,
) -> list[Mandi]:
    """Find mandis within radius_km of origin that have coordinates."""
    result = await db.execute(
        select(Mandi).where(Mandi.lat.is_not(None), Mandi.lon.is_not(None))
    )
    all_mandis = result.scalars().all()

    nearby = []
    for mandi in all_mandis:
        dist = haversine_km(origin_lat, origin_lon, float(mandi.lat), float(mandi.lon))
        if dist <= radius_km:
            nearby.append((dist, mandi))

    nearby.sort(key=lambda x: x[0])

    # Ensure must_include_id is present
    ids_in_result = {m.id for _, m in nearby}
    if must_include_id and must_include_id not in ids_in_result:
        result2 = await db.execute(select(Mandi).where(Mandi.id == must_include_id))
        extra = result2.scalar_one_or_none()
        if extra:
            dist = 0.0
            if extra.lat and extra.lon:
                dist = haversine_km(origin_lat, origin_lon, float(extra.lat), float(extra.lon))
            nearby.insert(0, (dist, extra))

    return [m for _, m in nearby]
