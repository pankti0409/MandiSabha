"""Agmarknet price tool — data.gov.in integration."""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
import structlog

from app.config import settings
from app.services.crops import to_agmarknet, to_canonical
from app.tools.registry import ToolResult

log = structlog.get_logger()

FIXTURE_PATH = "data/fixtures/mandi_prices_sample.json"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_date(s: str) -> Optional[date]:
    """Parse dd/mm/yyyy date strings from Agmarknet."""
    if not s:
        return None
    try:
        parts = s.split("/")
        if len(parts) == 3:
            return date(int(parts[2]), int(parts[1]), int(parts[0]))
    except Exception:
        pass
    try:
        return date.fromisoformat(s)
    except Exception:
        return None


def _normalize_record(raw: dict) -> Optional[dict]:
    """Normalize both field-casing variants into one internal record."""
    # Lowercase fields (primary resource)
    if "modal_price" in raw:
        rec = {
            "state": raw.get("state", ""),
            "district": raw.get("district", ""),
            "market": raw.get("market", ""),
            "commodity": raw.get("commodity", ""),
            "variety": raw.get("variety", ""),
            "grade": raw.get("grade", ""),
            "arrival_date": raw.get("arrival_date", ""),
            "min_price": raw.get("min_price", "0"),
            "max_price": raw.get("max_price", "0"),
            "modal_price": raw.get("modal_price", "0"),
        }
    # Capitalized fields (alt resource)
    elif "Modal_Price" in raw:
        rec = {
            "state": raw.get("State", ""),
            "district": raw.get("District", ""),
            "market": raw.get("Market", ""),
            "commodity": raw.get("Commodity", ""),
            "variety": raw.get("Variety", ""),
            "grade": raw.get("Grade", ""),
            "arrival_date": raw.get("Arrival_Date", ""),
            "min_price": raw.get("Min_Price", "0"),
            "max_price": raw.get("Max_Price", "0"),
            "modal_price": raw.get("Modal_Price", "0"),
        }
    else:
        return None

    # Parse numeric prices (often arrive as strings)
    try:
        rec["min_price"] = float(str(rec["min_price"]).replace(",", ""))
        rec["max_price"] = float(str(rec["max_price"]).replace(",", ""))
        rec["modal_price"] = float(str(rec["modal_price"]).replace(",", ""))
    except (ValueError, TypeError):
        return None

    # Validate
    if rec["modal_price"] <= 0:
        return None
    if rec["min_price"] > rec["max_price"]:
        return None

    # Parse date
    parsed_date = _parse_date(str(rec["arrival_date"]))
    if not parsed_date:
        return None
    rec["price_date"] = parsed_date

    # Map commodity to canonical
    canonical = to_canonical(rec["commodity"])
    rec["canonical_crop"] = canonical or rec["commodity"]

    return rec


def deduplicate_prices_by_mandi(records: list[dict]) -> list[dict]:
    """Group price records by unique market/mandi and select the latest price record for each market.

    Arbitrage requires multiple distinct mandis on the same day, NOT 1 mandi across multiple dates.
    """
    by_market: dict[str, dict] = {}
    for r in records:
        market_name = r.get("market", "").strip()
        state_name = r.get("state", "").strip()
        if not market_name:
            continue
        market_key = f"{state_name.lower()}:{market_name.lower()}"
        if market_key not in by_market:
            by_market[market_key] = r
        else:
            existing_date = by_market[market_key].get("price_date")
            new_date = r.get("price_date")
            if new_date and (existing_date is None or new_date > existing_date):
                by_market[market_key] = r
    return list(by_market.values())


async def scrape_apmc_live_feed(
    crop: str, state: str, district: Optional[str] = None
) -> list[dict]:
    """Resilient scraper querying public APMC feeds or agmarknet portal when api.data.gov.in is unroutable."""
    import re
    agmarknet_commodity = to_agmarknet(crop)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(timeout=4, follow_redirects=True) as client:
            # Query public agmarknet bulletin
            url = f"https://agmarknet.gov.in/SearchPage/SearchPage.aspx?Header=1&Commodity={agmarknet_commodity}&State={state}"
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200 and ("<table" in resp.text.lower() or "gridview" in resp.text.lower()):
                # Parse HTML table rows
                rows = []
                table_match = re.search(r"<table[^>]*>(.*?)</table>", resp.text, re.DOTALL | re.IGNORECASE)
                if table_match:
                    tr_matches = re.findall(r"<tr[^>]*>(.*?)</tr>", table_match.group(1), re.DOTALL | re.IGNORECASE)
                    for tr in tr_matches[1:]:  # skip header
                        tds = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.DOTALL | re.IGNORECASE)
                        clean_tds = [re.sub(r"<[^>]+>", "", td).strip() for td in tds]
                        if len(clean_tds) >= 7:
                            # Typical Agmarknet cols: State, District, Market, Commodity, Variety, Grade, Arrival_Date, Min, Max, Modal
                            rec = {
                                "state": clean_tds[0],
                                "district": clean_tds[1] if len(clean_tds) > 1 else "",
                                "market": clean_tds[2] if len(clean_tds) > 2 else "",
                                "commodity": clean_tds[3] if len(clean_tds) > 3 else crop,
                                "variety": clean_tds[4] if len(clean_tds) > 4 else "Other",
                                "grade": clean_tds[5] if len(clean_tds) > 5 else "FAQ",
                                "arrival_date": clean_tds[6] if len(clean_tds) > 6 else date.today().strftime("%d/%m/%Y"),
                                "min_price": clean_tds[7] if len(clean_tds) > 7 else "0",
                                "max_price": clean_tds[8] if len(clean_tds) > 8 else "0",
                                "modal_price": clean_tds[9] if len(clean_tds) > 9 else clean_tds[8] if len(clean_tds) > 8 else "0",
                            }
                            norm = _normalize_record(rec)
                            if norm:
                                rows.append(norm)
                if rows:
                    log.info("scraped_apmc_live_feed_success", count=len(rows), crop=crop, state=state)
                    return rows
    except Exception as exc:
        log.warning("scrape_apmc_live_feed_failed", error=str(exc), crop=crop, state=state)

    return []


async def _load_fixture(crop: str, state: Optional[str]) -> list[dict]:
    """Load fixture data from local JSON file."""
    import os
    if not os.path.exists(FIXTURE_PATH):
        return []
    with open(FIXTURE_PATH) as f:
        data = json.load(f)
    records = data if isinstance(data, list) else data.get("records", [])
    result = []
    for r in records:
        normalized = _normalize_record(r)
        if not normalized:
            continue
        if crop and normalized["canonical_crop"] != crop:
            continue
        if state and normalized["state"].lower() != state.lower():
            continue
        result.append(normalized)
    return deduplicate_prices_by_mandi(result)


async def get_mandi_prices(
    crop: str,
    state: str,
    district: Optional[str] = None,
    resource_id: Optional[str] = None,
) -> ToolResult:
    """Fetch mandi prices from Agmarknet via data.gov.in.

    Falls back to direct APMC scraper → cache → fixture on failure.
    Always deduplicates records by unique mandi, keeping the latest price.
    """
    from app.db import AsyncSessionLocal
    from app.models import ApiCache, PriceRecord
    from sqlalchemy import select
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    import hashlib

    agmarknet_commodity = to_agmarknet(crop)
    rid = resource_id or settings.data_gov_resource_id
    cache_key = f"prices:{rid}:{crop}:{state}:{district or ''}"

    if not settings.data_gov_api_key:
        log.warning("data_gov_api_key_missing", crop=crop)
        fixture_data = await _load_fixture(crop, state)
        if fixture_data:
            return ToolResult(
                ok=True,
                data=fixture_data,
                source="fixture",
                data_as_of=max((r["price_date"] for r in fixture_data), default=None),
                fetched_at=_now(),
                stale=True,
                warnings=["DATA_GOV_API_KEY not configured. Using sample fixture data. isSample=true"],
            )
        return ToolResult(ok=False, error="No API key and no fixture data available")

    # Check cache
    async with AsyncSessionLocal() as db:
        cached = await db.get(ApiCache, cache_key)
        if cached:
            age = (_now() - cached.fetched_at.replace(tzinfo=timezone.utc)).total_seconds()
            if age < (settings.price_cache_ttl_hours * 3600):
                records = cached.payload if isinstance(cached.payload, list) else []
                data_as_of = max((r.get("price_date") for r in records if r.get("price_date")), default=None)
                if data_as_of and isinstance(data_as_of, str):
                    data_as_of = date.fromisoformat(data_as_of)
                stale = False
                if data_as_of:
                    stale = (date.today() - data_as_of).days > settings.price_stale_days
                return ToolResult(
                    ok=True, data=records, source="cache",
                    data_as_of=data_as_of, fetched_at=cached.fetched_at, stale=stale,
                )

    # Fetch live
    all_records = []
    offset = 0
    page_size = 100

    try:
        async with httpx.AsyncClient(timeout=4) as client:
            while True:
                params: dict = {
                    "api-key": settings.data_gov_api_key,
                    "format": "json",
                    "limit": page_size,
                    "offset": offset,
                    "filters[state.keyword]": state,
                    "filters[commodity]": agmarknet_commodity,
                }
                if district:
                    params["filters[district]"] = district

                resp = await client.get(
                    f"https://api.data.gov.in/resource/{rid}",
                    params=params,
                )
                resp.raise_for_status()
                body = resp.json()

                records_raw = body.get("records", [])
                total = body.get("total", 0)

                for r in records_raw:
                    normalized = _normalize_record(r)
                    if normalized:
                        all_records.append(normalized)

                offset += page_size
                if offset >= total or not records_raw:
                    break

        if not all_records:
            log.warning("no_prices_returned", crop=crop, state=state)

    except (httpx.HTTPError, httpx.TimeoutException, OSError) as exc:
        log.warning("data_gov_fetch_failed", error=str(exc), crop=crop)

        # 1. Resilient APMC Scraper fallback
        scraped = await scrape_apmc_live_feed(crop, state, district)
        if scraped:
            deduped = deduplicate_prices_by_mandi(scraped)
            price_dates = [r["price_date"] for r in deduped if r.get("price_date")]
            data_as_of = max(price_dates) if price_dates else None
            stale = (date.today() - data_as_of).days > settings.price_stale_days if data_as_of else False
            return ToolResult(
                ok=True,
                data=deduped,
                source="live",
                data_as_of=data_as_of,
                fetched_at=_now(),
                stale=stale,
                warnings=["api.data.gov.in unroutable; retrieved via direct APMC live feed."],
            )

        # 2. Try cache (even if stale)
        async with AsyncSessionLocal() as db:
            cached = await db.get(ApiCache, cache_key)
            if cached:
                records = cached.payload if isinstance(cached.payload, list) else []
                deduped = deduplicate_prices_by_mandi(records)
                return ToolResult(
                    ok=True,
                    data=deduped,
                    source="cache",
                    fetched_at=cached.fetched_at,
                    stale=True,
                    warnings=["Upstream fetch failed; serving cached mandi prices"],
                )

        # 3. Try fixture fallback
        fixture_data = await _load_fixture(crop, state)
        if fixture_data:
            deduped = deduplicate_prices_by_mandi(fixture_data)
            return ToolResult(
                ok=True,
                data=deduped,
                source="fixture",
                data_as_of=max((r["price_date"] for r in deduped), default=None),
                fetched_at=_now(),
                stale=True,
                warnings=["api.data.gov.in unroutable. Using sample fixture data. isSample=true"],
            )
        return ToolResult(ok=False, error=f"Upstream fetch failed: {exc}")

    # Deduplicate live records by unique mandi, selecting latest price date
    all_records = deduplicate_prices_by_mandi(all_records)

    # Compute data_as_of
    price_dates = [r["price_date"] for r in all_records if r.get("price_date")]
    data_as_of = max(price_dates) if price_dates else None
    stale = False
    if data_as_of:
        stale = (date.today() - data_as_of).days > settings.price_stale_days

    # Persist to cache
    serializable = [
        {**r, "price_date": r["price_date"].isoformat() if r.get("price_date") else None}
        for r in all_records
    ]
    async with AsyncSessionLocal() as db:
        entry = ApiCache(
            key=cache_key,
            payload=serializable,
            fetched_at=_now(),
            ttl_seconds=settings.price_cache_ttl_hours * 3600,
            source="live",
        )
        await db.merge(entry)
        await db.commit()

    return ToolResult(
        ok=True,
        data=all_records,
        source="live",
        data_as_of=data_as_of,
        fetched_at=_now(),
        stale=stale,
    )
