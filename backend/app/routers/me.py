"""Me router — current user profile and dashboard."""
from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.db import get_db
from app.models import User
from app.schemas import SUPPORTED_CROPS, UpdateMeRequest, UserOut

router = APIRouter(prefix="/me", tags=["user"])


@router.get("", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("", response_model=UserOut)
async def update_me(
    body: UpdateMeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Partial profile update. Re-geocodes home coords when location changes."""
    update_data = body.model_dump(exclude_unset=True, by_alias=False)

    # Validate language
    if "language" in update_data and update_data["language"] not in ("en", "hi", "gu"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "invalid_language", "message": "Language must be en, hi, or gu"},
        )

    # Validate crops
    if "crops" in update_data:
        invalid = [c for c in update_data["crops"] if c not in SUPPORTED_CROPS]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "invalid_crops", "message": f"Unsupported crops: {invalid}"},
            )

    location_changed = any(k in update_data for k in ("village", "district", "state"))

    for field, value in update_data.items():
        if field == "crop_details" and value is not None:
            value = [v.model_dump() if hasattr(v, "model_dump") else v for v in value]
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    # Re-geocode in background if location changed
    if location_changed:
        background_tasks.add_task(_geocode_home, current_user.id)

    return UserOut.model_validate(current_user)


async def _geocode_home(user_id: str) -> None:
    """Background task: geocode user home location."""
    from app.db import AsyncSessionLocal
    from app.tools.geocode import geocode
    from sqlalchemy import select, update

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return
        place = f"{user.village}, {user.district or ''}, {user.state or 'India'}"
        geo = await geocode(place)
        if geo.ok:
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(home_lat=geo.data["lat"], home_lon=geo.data["lon"])
            )
            await db.commit()


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard data — all from stored sabha records."""
    from sqlalchemy import select, func
    from app.models import Sabha
    from datetime import datetime, timezone, timedelta
    import calendar

    # Recent sessions
    result = await db.execute(
        select(Sabha)
        .where(Sabha.user_id == current_user.id)
        .order_by(Sabha.created_at.desc())
        .limit(5)
    )
    recent = result.scalars().all()

    sessions = []
    for s in recent:
        draft = s.draft or {}
        rec = s.recommendation or {}
        winner = rec.get("winner", {})
        surplus = rec.get("surplusVsLocal", {})
        sessions.append({
            "id": s.id,
            "displayCode": s.display_code,
            "date": s.created_at.isoformat(),
            "crop": draft.get("crop"),
            "quantity": draft.get("quantity"),
            "mandi": winner.get("name"),
            "gain": surplus.get("total"),
            "status": "Ready to Dispatch" if s.user_status == "approved" else "Completed" if s.user_status == "sold" else s.status,
            "distance": f"{winner.get('distanceKm', 0):.0f} km" if winner.get("distanceKm") else None,
            "pricePerQ": winner.get("modalPrice"),
        })

    # Monthly stats (last 6 months)
    monthly = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_str = month_date.strftime("%b")
        yr, mo = month_date.year, month_date.month
        first_day = datetime(yr, mo, 1, tzinfo=timezone.utc)
        last_day = datetime(yr, mo, calendar.monthrange(yr, mo)[1], 23, 59, 59, tzinfo=timezone.utc)

        result2 = await db.execute(
            select(Sabha)
            .where(
                Sabha.user_id == current_user.id,
                Sabha.created_at >= first_day,
                Sabha.created_at <= last_day,
                Sabha.status == "completed",
            )
        )
        month_sabhas = result2.scalars().all()
        estimated_extra = 0
        for s in month_sabhas:
            rec = s.recommendation or {}
            surplus = rec.get("surplusVsLocal", {})
            if surplus.get("total"):
                estimated_extra += surplus["total"]

        monthly.append({"month": month_str, "estimatedExtra": estimated_extra, "sabhas": len(month_sabhas)})

    # Winners distribution
    all_completed = (await db.execute(
        select(Sabha).where(Sabha.user_id == current_user.id, Sabha.status == "completed")
    )).scalars().all()

    winners_count: dict[str, int] = {}
    for s in all_completed:
        rec = s.recommendation or {}
        winner_name = rec.get("winner", {}).get("name")
        if winner_name:
            winners_count[winner_name] = winners_count.get(winner_name, 0) + 1

    total_count = sum(winners_count.values())
    winners = [
        {
            "name": name,
            "count": count,
            "percent": round(count / total_count * 100) if total_count else 0,
        }
        for name, count in sorted(winners_count.items(), key=lambda x: -x[1])
    ]

    # Market pulse — user's crops, best mandi in their state
    pulse = []
    user_crops = current_user.crops or []
    user_state = current_user.state or "Maharashtra"
    for crop in user_crops[:6]:
        pr = await (lambda: __import__("app.tools.mandi_prices", fromlist=["get_mandi_prices"]).get_mandi_prices(crop, user_state))()
        if pr.ok and pr.data:
            best_record = max(pr.data, key=lambda r: r.get("modal_price", 0))
            pulse.append({
                "crop": crop,
                "price": best_record["modal_price"],
                "changePct": None,  # computed from trend history
                "mandi": best_record.get("market"),
                "high": best_record.get("max_price"),
                "low": best_record.get("min_price"),
                "trend": [],
                "dataAsOf": best_record.get("price_date").isoformat() if best_record.get("price_date") else None,
                "source": pr.source,
            })

    total_extra = sum(m["estimatedExtra"] for m in monthly)

    return {
        "sessions": sessions,
        "monthly": monthly,
        "winners": winners,
        "pulse": pulse,
        "totals": {
            "sabhasHeld": len(all_completed),
            "estimatedExtraTotal": total_extra,
            "note": "Surplus figures are estimated from mandi prices vs local baseline. Mark sessions as sold with actual price for accurate tracking.",
        },
        "freshness": {
            "dataAsOf": None,
            "source": "live",
            "isSample": False,
        },
    }
