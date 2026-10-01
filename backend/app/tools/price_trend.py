"""Price trend tool — from stored PriceRecord history."""
from __future__ import annotations

import statistics
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tools.registry import ToolResult


async def get_price_trend(
    db: AsyncSession,
    crop: str,
    mandi_id: Optional[str] = None,
    mandi_raw: Optional[str] = None,
    days: int = 30,
) -> ToolResult:
    """Fetch price trend from PriceRecord history.
    
    Returns series, change pcts, slope, volatility.
    Honest about thin history.
    """
    from app.models import PriceRecord, Mandi
    from sqlalchemy import and_

    cutoff = date.today() - timedelta(days=days)

    query = (
        select(PriceRecord)
        .where(
            PriceRecord.crop == crop,
            PriceRecord.price_date >= cutoff,
        )
        .order_by(PriceRecord.price_date)
    )

    if mandi_id:
        query = query.where(PriceRecord.mandi_id == mandi_id)
    elif mandi_raw:
        query = query.where(PriceRecord.mandi_raw.ilike(f"%{mandi_raw}%"))

    result = await db.execute(query)
    records = result.scalars().all()

    series = [
        {
            "date": r.price_date.isoformat(),
            "modal": float(r.modal_price),
            "min": float(r.min_price),
            "max": float(r.max_price),
        }
        for r in records
    ]

    history_days = len(set(r["date"] for r in series))

    if not series:
        return ToolResult(
            ok=True,
            data={
                "series": [],
                "historyDaysAvailable": 0,
                "changePct7d": None,
                "changePct30d": None,
                "slope": None,
                "volatility": None,
                "note": "No price history available for this mandi/crop combination",
            },
            source="local",
            warnings=["No historical data; run scripts/refresh_prices.py daily to build history"],
        )

    modals = [r["modal"] for r in series]

    change_7d = None
    if history_days >= 7 and len(modals) >= 2:
        recent = modals[-1]
        old = modals[-7] if len(modals) >= 7 else modals[0]
        change_7d = round((recent - old) / old * 100, 1) if old > 0 else None

    change_30d = None
    if history_days >= 14 and len(modals) >= 2:
        change_30d = round((modals[-1] - modals[0]) / modals[0] * 100, 1) if modals[0] > 0 else None

    # Simple linear slope (₹/day)
    slope = None
    if len(modals) >= 3:
        n = len(modals)
        x_mean = (n - 1) / 2
        y_mean = sum(modals) / n
        numerator = sum((i - x_mean) * (modals[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        slope = round(numerator / denominator, 2) if denominator != 0 else 0

    volatility = None
    if len(modals) >= 3:
        mean_val = sum(modals) / len(modals)
        volatility = round(statistics.stdev(modals) / mean_val * 100, 2) if mean_val > 0 else 0

    warnings = []
    if history_days < 7:
        warnings.append(
            f"Only {history_days} day(s) of price history available. Trend is not established."
        )

    return ToolResult(
        ok=True,
        data={
            "series": series,
            "historyDaysAvailable": history_days,
            "changePct7d": change_7d,
            "changePct30d": change_30d,
            "slope": slope,
            "volatility": volatility,
        },
        source="local",
        warnings=warnings,
    )
