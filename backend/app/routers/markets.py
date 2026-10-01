"""Markets router — price explorer, trends."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user, get_optional_user
from app.db import get_db
from app.models import User
from app.schemas import MarketPriceRow, MarketPricesResponse, ReverseGeocodeResponse

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/prices", response_model=MarketPricesResponse)
async def get_market_prices(
    crop: str = Query(...),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    sort: str = Query("modal"),
    limit: int = Query(50),
    offset: int = Query(0),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Explorer endpoint — mandi prices with freight estimates."""
    from app.tools.mandi_prices import get_mandi_prices
    from app.services.mandi_directory import find_mandi_by_name, haversine_km

    fetch_state = state or (current_user.state if current_user and current_user.state else "Maharashtra")
    pr = await get_mandi_prices(crop, fetch_state, district)

    rows = []
    data_as_of = None

    if pr.ok and pr.data:
        origin_lat = float(current_user.home_lat) if current_user and current_user.home_lat else None
        origin_lon = float(current_user.home_lon) if current_user and current_user.home_lon else None

        for rec in pr.data:
            if q and q.lower() not in rec.get("market", "").lower():
                continue

            price_date = rec.get("price_date")
            if isinstance(price_date, str):
                try:
                    price_date = date.fromisoformat(price_date)
                except Exception:
                    price_date = None

            if data_as_of is None or (price_date and price_date > data_as_of):
                data_as_of = price_date

            # Distance estimate
            dist_km = None
            freight_est = None
            mandi_obj = await find_mandi_by_name(db, rec.get("market", ""), state=fetch_state)
            if mandi_obj and mandi_obj.lat and mandi_obj.lon and origin_lat:
                straight_km = haversine_km(origin_lat, origin_lon, float(mandi_obj.lat), float(mandi_obj.lon))
                dist_km = round(straight_km, 1)
                # Simple freight estimate: rate_per_km * distance * 2 (round trip)
                from app.config import settings
                rate = settings.vehicle_default_rate_per_km_map.get(
                    getattr(current_user, "vehicle_type", None) or "pickup", 14
                )
                freight_est = round(dist_km * rate * 2 / rec.get("modal_price", 1) if rec.get("modal_price") else 0, 0)

            rows.append(MarketPriceRow(
                mandi_id=mandi_obj.id if mandi_obj else None,
                mandi=rec.get("market", ""),
                district=rec.get("district", ""),
                state=rec.get("state", fetch_state),
                crop=crop,
                variety=rec.get("variety", ""),
                min_price=rec.get("min_price"),
                max_price=rec.get("max_price"),
                modal_price=rec.get("modal_price"),
                price_date=price_date,
                change_pct=None,  # computed from trend history — not available without history
                trend_5d=[],
                arrivals_qty=rec.get("arrivals_qty"),
                distance_km=dist_km,
                freight_est_per_quintal=freight_est,
                stale=pr.stale,
                source=pr.source,
            ))

    # Sort
    if sort == "modal":
        rows.sort(key=lambda r: r.modal_price or 0, reverse=True)
    elif sort == "change":
        rows.sort(key=lambda r: r.change_pct or 0, reverse=True)
    elif sort == "arrivals":
        rows.sort(key=lambda r: r.arrivals_qty or 0, reverse=True)

    total = len(rows)
    paginated = rows[offset:offset + limit]

    return MarketPricesResponse(
        rows=paginated,
        total=total,
        data_as_of=data_as_of,
        fetched_at=pr.fetched_at,
        source=pr.source,
        is_sample=pr.source == "fixture",
    )


@router.get("/trend")
async def get_trend(
    crop: str = Query(...),
    mandi: str = Query(...),
    days: int = Query(30),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Historical price trend for a specific mandi/crop."""
    from app.tools.price_trend import get_price_trend
    from app.tools.msp import get_msp

    trend = await get_price_trend(db, crop, mandi_raw=mandi, days=days)
    msp = await get_msp(crop)
    msp_per_q = msp.data.get("mspPerQuintal") if msp.ok and msp.data else None

    td = trend.data or {}
    return {
        "crop": crop,
        "mandi": mandi,
        "series": td.get("series", []),
        "historyDaysAvailable": td.get("historyDaysAvailable", 0),
        "changePct7d": td.get("changePct7d"),
        "changePct30d": td.get("changePct30d"),
        "slope": td.get("slope"),
        "volatility": td.get("volatility"),
        "mspPerQuintal": msp_per_q,
        "warnings": trend.warnings,
    }


@router.get("/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Reverse geocode latitude and longitude to village, district, state.
    
    Open endpoint accessible by farmers during registration or sabha creation.
    """
    from app.tools.geocode import reverse_geocode

    res = await reverse_geocode(lat, lon)
    if not res.ok or not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "location_not_found", "message": res.error or "Location could not be identified"},
        )

    d = res.data
    return ReverseGeocodeResponse(
        village=d.get("village", ""),
        district=d.get("district", ""),
        state=d.get("state", ""),
        display_name=d.get("display_name", ""),
        lat=float(d.get("lat", lat)),
        lon=float(d.get("lon", lon)),
        postcode=d.get("postcode"),
        source=res.source or "live",
        warnings=res.warnings or [],
    )


@router.get("/geocode")
async def forward_geocode(
    q: str = Query(..., description="Place name or address to geocode"),
):
    """Forward geocode a place name to latitude/longitude coordinates."""
    from app.tools.geocode import geocode

    res = await geocode(q)
    if not res.ok or not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "location_not_found", "message": res.error or "Location could not be geocoded"},
        )
    return res.data

