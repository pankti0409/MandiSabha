"""Health router."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.config import settings
from app.db import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    """Health check — no secrets exposed."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {type(exc).__name__}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": "0.1.0",
        "db": db_status,
        "upstreams": {
            "dataGov": {"configured": bool(settings.data_gov_api_key)},
            "groq": {"configured": bool(settings.groq_api_key)},
            "sarvam": {"configured": bool(settings.sarvam_api_key)},
            "openMeteo": {"configured": True},  # no key needed
            "osrm": {"configured": True},  # public
            "nominatim": {"configured": True},  # public
        },
    }
