"""Probe upstream APIs once, print real response shapes, and verify model IDs.

Run BEFORE relying on API response shapes.
Output goes to stdout; differences should be noted in DECISIONS.md.

Usage:
    cd backend
    python scripts/probe_apis.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys

import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings


async def probe_groq():
    """Probe Groq models endpoint."""
    if not settings.groq_api_key:
        print("GROQ: GROQ_API_KEY not set — skipping\n")
        return

    print("=== GROQ MODELS ===")
    async with httpx.AsyncClient(
        base_url=settings.groq_base_url,
        headers={"Authorization": f"Bearer {settings.groq_api_key}"},
        timeout=10,
    ) as client:
        try:
            resp = await client.get("/models")
            resp.raise_for_status()
            data = resp.json()
            ids = sorted(m["id"] for m in data.get("data", []))
            print(f"Available models ({len(ids)}):")
            for m_id in ids:
                marker = ""
                for conf in [settings.llm_model_primary, settings.llm_model_small, settings.llm_model_fallback]:
                    if conf == m_id:
                        marker = " ← CONFIGURED"
                print(f"  {m_id}{marker}")

            # Check configured models
            configured = {settings.llm_model_primary, settings.llm_model_small, settings.llm_model_fallback}
            for c in configured:
                if c and c not in ids:
                    print(f"\n  ⚠️  MODEL NOT AVAILABLE: {c}")
                    print(f"     → Update LLM_MODEL_* in .env and note deviation in DECISIONS.md")
        except Exception as exc:
            print(f"GROQ: ERROR — {exc}")
    print()


async def probe_data_gov():
    """Probe data.gov.in Agmarknet API with one record."""
    if not settings.data_gov_api_key:
        print("DATA_GOV: DATA_GOV_API_KEY not set — skipping\n")
        return

    print("=== AGMARKNET API ===")
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"https://api.data.gov.in/resource/{settings.data_gov_resource_id}",
                params={
                    "api-key": settings.data_gov_api_key,
                    "format": "json",
                    "limit": 1,
                    "offset": 0,
                    "filters[state.keyword]": "Maharashtra",
                    "filters[commodity]": "Onion",
                },
            )
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(f"Total: {data.get('total', '?')}")
            if data.get("records"):
                rec = data["records"][0]
                print(f"Field names: {list(rec.keys())}")
                print(f"Sample record: {json.dumps(rec, indent=2)}")
                # Check for casing
                if "modal_price" in rec:
                    print("  → Lowercase format (primary resource)")
                elif "Modal_Price" in rec:
                    print("  → Capitalized format (alt resource)")
                else:
                    print("  ⚠️  UNKNOWN FORMAT — update _normalize_record() and note in DECISIONS.md")
        except Exception as exc:
            print(f"DATA_GOV: ERROR — {exc}")
    print()


async def probe_open_meteo():
    """Probe Open-Meteo for a known lat/lon."""
    print("=== OPEN-METEO ===")
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{settings.open_meteo_base_url}/forecast",
                params={
                    "latitude": 20.0,
                    "longitude": 74.0,
                    "daily": "temperature_2m_max,precipitation_sum",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
            )
            print(f"Status: {resp.status_code}")
            data = resp.json()
            print(f"Daily keys: {list(data.get('daily', {}).keys())}")
        except Exception as exc:
            print(f"OPEN-METEO: ERROR — {exc}")
    print()


async def probe_osrm():
    """Probe OSRM routing."""
    print("=== OSRM ===")
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            # Nashik → Pune
            resp = await client.get(
                f"{settings.osrm_base_url}/route/v1/driving/74.0,20.0;73.85,18.52",
                params={"overview": "simplified"},
            )
            print(f"Status: {resp.status_code}")
            data = resp.json()
            if data.get("routes"):
                r = data["routes"][0]
                print(f"Distance: {r['distance']/1000:.1f} km, Duration: {r['duration']/60:.0f} min")
        except Exception as exc:
            print(f"OSRM: ERROR — {exc}")
    print()


async def probe_nominatim():
    """Probe Nominatim geocoding."""
    print("=== NOMINATIM ===")
    async with httpx.AsyncClient(
        headers={"User-Agent": settings.nominatim_user_agent},
        timeout=10,
    ) as client:
        try:
            resp = await client.get(
                f"{settings.nominatim_base_url}/search",
                params={"format": "jsonv2", "limit": 1, "q": "Nashik, Maharashtra, India"},
            )
            print(f"Status: {resp.status_code}")
            data = resp.json()
            if data:
                r = data[0]
                print(f"Result: lat={r['lat']}, lon={r['lon']}, type={r.get('type')}")
        except Exception as exc:
            print(f"NOMINATIM: ERROR — {exc}")
    print()


async def main():
    print("Probing upstream APIs...\n")
    await probe_groq()
    await probe_data_gov()
    await probe_open_meteo()
    await probe_osrm()
    await probe_nominatim()
    print("Done. Review output and note any discrepancies in DECISIONS.md")


if __name__ == "__main__":
    asyncio.run(main())
