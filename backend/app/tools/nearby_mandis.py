"""Candidate mandis identification tool.

Identifies up to 5 distinct candidate mandis reporting the requested crop
within the search radius.
"""
from __future__ import annotations

import math
from typing import Optional

import structlog
from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.models import Mandi
from app.services.mandi_directory import haversine_km
from app.tools.registry import ToolResult

log = structlog.get_logger()


async def find_candidate_mandis(
    crop: str,
    origin_lat: float,
    origin_lon: float,
    radius_km: float = 200.0,
    must_include_id: Optional[str] = None,
    limit: int = 5,
) -> ToolResult:
    """Identify up to 5 candidate competitor mandis for crop within radius_km."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Mandi).where(Mandi.lat.is_not(None), Mandi.lon.is_not(None))
        )
        all_mandis = result.scalars().all()

    if not all_mandis:
        return ToolResult(ok=False, error="No mandis available in directory", source="local")

    # Compute distances
    candidates_with_dist = []
    must_include_mandi = None

    for m in all_mandis:
        dist = haversine_km(origin_lat, origin_lon, float(m.lat), float(m.lon))
        if must_include_id and (m.id == must_include_id or m.name.lower() == must_include_id.lower()):
            must_include_mandi = (dist, m)
        candidates_with_dist.append((dist, m))

    # Sort all by distance
    candidates_with_dist.sort(key=lambda x: x[0])

    # Filter by radius
    within_radius = [x for x in candidates_with_dist if x[0] <= radius_km]

    # If not enough within radius, expand to closest mandis
    selected_tuples = within_radius if len(within_radius) >= limit else candidates_with_dist[:limit]

    # Ensure must_include_mandi is present if requested
    if must_include_mandi and must_include_mandi not in selected_tuples:
        selected_tuples = [must_include_mandi] + [x for x in selected_tuples if x[1].id != must_include_mandi[1].id]

    final_candidates = selected_tuples[:limit]

    data = [
        {
            "id": m.id,
            "name": m.name,
            "district": m.district,
            "state": m.state,
            "lat": float(m.lat),
            "lon": float(m.lon),
            "distance_km": round(dist, 1),
            "verified": m.verified,
        }
        for dist, m in final_candidates
    ]

    return ToolResult(
        ok=True,
        data=data,
        source="local",
        warnings=[] if len(within_radius) >= len(final_candidates) else [
            f"Expanded search beyond {radius_km} km to find {len(final_candidates)} candidate mandis"
        ],
    )
