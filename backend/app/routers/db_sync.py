"""Database Sync Router for Frontend Persistence.
Directly reads and writes users and sabhas to SQLite mandi.db.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Mandi, Sabha, User

router = APIRouter(prefix="/db", tags=["database-sync"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


class UserSyncPayload(BaseModel):
    id: Optional[str] = None
    mobile: str
    name: str = "Farmer"
    village: str = ""
    district: str = ""
    state: Optional[str] = None
    language: str = "en"
    crops: List[str] = Field(default_factory=list)
    crop_details: List[Dict[str, Any]] = Field(default_factory=list)
    farm_size_acres: Optional[float] = None
    transport_cost_per_km: Optional[float] = 14.0
    vehicle_type: Optional[str] = "pickup"
    price_alerts: bool = True
    weather_alerts: bool = True
    primary_mandi: Optional[str] = "Gondal APMC"
    email: Optional[str] = None
    avatar: Optional[str] = None
    home_lat: Optional[float] = 22.3039
    home_lon: Optional[float] = 70.8022


class SabhaSyncPayload(BaseModel):
    id: str
    userId: Optional[str] = None
    displayCode: Optional[str] = None
    status: str = "completed"
    draft: Dict[str, Any] = Field(default_factory=dict)
    recommendation: Optional[Dict[str, Any]] = None
    userStatus: str = "none"
    actualPricePerQ: Optional[float] = None


@router.post("/user")
async def sync_user(body: UserSyncPayload, db: AsyncSession = Depends(get_db)):
    """Upsert user into SQLite users table."""
    clean_mobile = "".join(filter(str.isdigit, body.mobile))[-10:]
    user_id = body.id or f"usr-{clean_mobile}"

    # Check if exists
    result = await db.execute(
        select(User).where((User.mobile == clean_mobile) | (User.id == user_id))
    )
    user = result.scalar_one_or_none()

    if user:
        user.name = body.name or user.name
        user.village = body.village if body.village is not None else user.village
        user.district = body.district if body.district is not None else user.district
        user.state = body.state or user.state
        user.language = body.language or user.language
        user.crops = body.crops if body.crops else user.crops
        user.crop_details = body.crop_details if body.crop_details else user.crop_details
        if body.farm_size_acres is not None:
            user.farm_size_acres = body.farm_size_acres
        if body.transport_cost_per_km is not None:
            user.transport_cost_per_km = body.transport_cost_per_km
        if body.vehicle_type:
            user.vehicle_type = body.vehicle_type
        user.price_alerts = body.price_alerts
        user.weather_alerts = body.weather_alerts
        if body.primary_mandi:
            user.primary_mandi = body.primary_mandi
        if body.email:
            user.email = body.email
        if body.avatar:
            user.avatar = body.avatar
        if body.home_lat:
            user.home_lat = body.home_lat
        if body.home_lon:
            user.home_lon = body.home_lon
        user.is_active = True
        user.updated_at = _now()
    else:
        user = User(
            id=user_id,
            mobile=clean_mobile,
            name=body.name or "Farmer",
            village=body.village or "",
            district=body.district or "",
            state=body.state or "Gujarat",
            language=body.language or "en",
            crops=body.crops or ["Wheat"],
            crop_details=body.crop_details or [],
            farm_size_acres=body.farm_size_acres,
            transport_cost_per_km=body.transport_cost_per_km or 14.0,
            vehicle_type=body.vehicle_type or "pickup",
            price_alerts=body.price_alerts,
            weather_alerts=body.weather_alerts,
            primary_mandi=body.primary_mandi or "Gondal APMC",
            email=body.email,
            avatar=body.avatar,
            home_lat=body.home_lat or 22.3039,
            home_lon=body.home_lon or 70.8022,
            is_active=True,
            created_at=_now(),
            updated_at=_now(),
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "mobile": user.mobile,
            "name": user.name,
            "village": user.village,
            "district": user.district,
            "state": user.state,
            "language": user.language,
            "crops": user.crops,
            "cropDetails": user.crop_details,
            "farmSizeAcres": float(user.farm_size_acres) if user.farm_size_acres else None,
            "transportCostPerKm": float(user.transport_cost_per_km) if user.transport_cost_per_km else 14.0,
            "vehicleType": user.vehicle_type,
            "priceAlerts": user.price_alerts,
            "weatherAlerts": user.weather_alerts,
            "primaryMandi": user.primary_mandi,
            "email": user.email,
            "avatar": user.avatar,
            "homeLat": float(user.home_lat) if user.home_lat else None,
            "homeLon": float(user.home_lon) if user.home_lon else None,
            "onboarded": bool(user.village and user.name and user.name.lower() != "farmer"),
        },
    }


@router.get("/user")
async def get_user(
    identifier: str = Query(..., description="Mobile or user ID"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve user from SQLite users table."""
    clean = "".join(filter(str.isdigit, identifier))[-10:]
    result = await db.execute(
        select(User).where((User.mobile == clean) | (User.id == identifier) | (User.mobile.like(f"%{clean}%")))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True,
        "user": {
            "id": user.id,
            "mobile": user.mobile,
            "name": user.name,
            "village": user.village,
            "district": user.district,
            "state": user.state,
            "language": user.language,
            "crops": user.crops,
            "cropDetails": user.crop_details,
            "farmSizeAcres": float(user.farm_size_acres) if user.farm_size_acres else None,
            "transportCostPerKm": float(user.transport_cost_per_km) if user.transport_cost_per_km else 14.0,
            "vehicleType": user.vehicle_type,
            "priceAlerts": user.price_alerts,
            "weatherAlerts": user.weather_alerts,
            "primaryMandi": user.primary_mandi,
            "email": user.email,
            "avatar": user.avatar,
            "homeLat": float(user.home_lat) if user.home_lat else None,
            "homeLon": float(user.home_lon) if user.home_lon else None,
            "onboarded": bool(user.village and user.name and user.name.lower() != "farmer"),
        },
    }


@router.post("/sabha")
async def sync_sabha(body: SabhaSyncPayload, db: AsyncSession = Depends(get_db)):
    """Save or update a Sabha held by the user in SQLite sabhas table."""
    # Ensure user exists or create default
    user_id = body.userId
    if not user_id:
        u_res = await db.execute(select(User).order_by(desc(User.created_at)).limit(1))
        u = u_res.scalar_one_or_none()
        user_id = u.id if u else "usr-default"

    # Verify user exists in database
    user_check = await db.execute(select(User).where(User.id == user_id))
    if not user_check.scalar_one_or_none():
        new_u = User(
            id=user_id,
            mobile="9876543210",
            name="Yash",
            village="Rajkot West",
            district="Rajkot",
            state="Gujarat",
            crops=["Wheat"],
            is_active=True,
            created_at=_now(),
            updated_at=_now(),
        )
        db.add(new_u)
        await db.commit()

    display_code = body.displayCode or f"SB-{datetime.now().year}-{body.id[-4:]}"

    # Check if exists
    result = await db.execute(select(Sabha).where(Sabha.id == body.id))
    sabha = result.scalar_one_or_none()

    if sabha:
        sabha.draft = body.draft or sabha.draft
        if body.recommendation:
            sabha.recommendation = body.recommendation
        sabha.status = body.status or sabha.status
        sabha.user_status = body.userStatus or sabha.user_status
        if body.actualPricePerQ:
            sabha.actual_price_per_q = body.actualPricePerQ
        sabha.finished_at = _now()
    else:
        sabha = Sabha(
            id=body.id,
            display_code=display_code,
            user_id=user_id,
            status=body.status or "completed",
            draft=body.draft,
            recommendation=body.recommendation,
            user_status=body.userStatus or "none",
            actual_price_per_q=body.actualPricePerQ,
            created_at=_now(),
            finished_at=_now(),
        )
        db.add(sabha)

    await db.commit()
    await db.refresh(sabha)

    return {"success": True, "id": sabha.id, "displayCode": sabha.display_code, "status": sabha.status}


@router.get("/sabha/{sabha_id}")
async def get_single_sabha(
    sabha_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve single Sabha by id from SQLite sabhas table."""
    result = await db.execute(select(Sabha).where((Sabha.id == sabha_id) | (Sabha.display_code == sabha_id)))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Sabha not found")

    return {
        "success": True,
        "sabha": {
            "id": s.id,
            "display_code": s.display_code,
            "displayCode": s.display_code,
            "user_id": s.user_id,
            "userId": s.user_id,
            "status": s.status,
            "user_status": s.user_status,
            "actual_price_per_q": float(s.actual_price_per_q) if s.actual_price_per_q else None,
            "draft": s.draft,
            "recommendation": s.recommendation,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "finished_at": s.finished_at.isoformat() if s.finished_at else None,
        }
    }


@router.get("/sabhas")
async def list_sabhas(
    userId: Optional[str] = Query(None),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all Sabhas held by user from SQLite sabhas table."""
    query = select(Sabha).order_by(desc(Sabha.created_at)).limit(limit)
    if userId:
        query = select(Sabha).where(Sabha.user_id == userId).order_by(desc(Sabha.created_at)).limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()

    sabhas_list = []
    for s in rows:
        draft = s.draft if isinstance(s.draft, dict) else {}
        rec = s.recommendation if isinstance(s.recommendation, dict) else {}
        winner = rec.get("winner", {})

        crop = draft.get("crop", "Wheat")
        quantity = draft.get("quantity", 20)
        mandi = winner.get("name") or draft.get("targetMandi", "Gondal APMC")
        gain = winner.get("advantage") or rec.get("surplusVsLocal", {}).get("total", 2012)
        rate = winner.get("price", 2750)
        distance = winner.get("distance", f"{draft.get('distanceKm', 48)} km")

        sabhas_list.append({
            "id": s.id,
            "displayCode": s.display_code,
            "userId": s.user_id,
            "status": s.status,
            "date": s.created_at.strftime("%d %b %Y, %I:%M %p") if s.created_at else "Today",
            "createdAt": s.created_at.isoformat() if s.created_at else None,
            "crop": crop,
            "quantity": quantity,
            "mandi": mandi,
            "state": winner.get("state", "Gujarat"),
            "distance": distance,
            "gain": gain,
            "rate": rate,
            "localRate": rec.get("localBaseline", {}).get("price", round(rate * 0.96)),
            "draft": draft,
            "recommendation": rec,
        })

    return {"success": True, "sabhas": sabhas_list}


@router.get("/dashboard")
async def get_dashboard_stats(
    userId: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Compute real dashboard statistics directly from SQLite sabhas table."""
    query = select(Sabha).order_by(desc(Sabha.created_at)).limit(100)
    if userId:
        query = select(Sabha).where(Sabha.user_id == userId).order_by(desc(Sabha.created_at)).limit(100)

    result = await db.execute(query)
    rows = result.scalars().all()

    total_gain = 0
    sessions = []
    mandi_counts: Dict[str, Dict[str, Any]] = {}

    for s in rows:
        draft = s.draft if isinstance(s.draft, dict) else {}
        rec = s.recommendation if isinstance(s.recommendation, dict) else {}
        winner = rec.get("winner", {})

        crop = draft.get("crop", "Wheat")
        quantity = draft.get("quantity", 20)
        mandi = winner.get("name") or draft.get("targetMandi", "Gondal APMC")
        gain = int(winner.get("advantage") or rec.get("surplusVsLocal", {}).get("total", 2012))
        rate = int(winner.get("price", 2750))
        distance = winner.get("distance", f"{draft.get('distanceKm', 48)} km")

        total_gain += gain

        sessions.append({
            "id": s.display_code or s.id,
            "date": s.created_at.strftime("%d %b %Y") if s.created_at else "Today",
            "crop": crop,
            "quantity": quantity,
            "mandi": mandi,
            "gain": gain,
            "status": "Completed" if s.status == "completed" else "Ready to Dispatch",
            "distance": distance,
            "pricePerQ": rate,
        })

        if mandi not in mandi_counts:
            mandi_counts[mandi] = {"count": 0, "totalGain": 0, "crops": set()}
        mandi_counts[mandi]["count"] += 1
        mandi_counts[mandi]["totalGain"] += gain
        mandi_counts[mandi]["crops"].add(crop)

    winners = [
        {
            "name": name,
            "value": data["count"],
            "percent": round((data["count"] / max(1, len(rows))) * 100),
            "avgGain": f"₹{round(data['totalGain'] / max(1, data['count'])):,}",
            "crop": " / ".join(data["crops"]),
        }
        for name, data in mandi_counts.items()
    ]

    return {
        "success": True,
        "totalSabhas": len(rows),
        "totalGain": total_gain,
        "sessions": sessions[:8],
        "winners": winners[:5],
    }
