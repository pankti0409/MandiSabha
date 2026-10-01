"""Sabha orchestrator — coordinates all agents and builds the final recommendation."""
from __future__ import annotations

import asyncio
import json
import math
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

import structlog

from app.agents.base import AgentError, BaseAgent
from app.agents.prompts import (
    ANALYST_SYSTEM, INTAKE_SYSTEM, LOGISTICS_SYSTEM,
    MANDI_SYSTEM, NEGOTIATOR_SYSTEM, RISK_SYSTEM,
)
from app.config import settings
from app.services.crops import to_agmarknet, to_canonical
from app.services.economics import (
    EconomicsInput, compute_arbitrage_spread_pct,
    compute_confidence, compute_net_value, compute_surplus_vs_local,
)
from app.services.events import emit_event
from app.services.llm import llm_provider
from app.services.llm.provider import LLMProvider
from app.services.mandi_directory import find_mandi_by_name, find_nearby_mandis_in_directory, haversine_km
from app.tools.geocode import geocode
from app.tools.mandi_prices import get_mandi_prices
from app.tools.msp import get_msp
from app.tools.net_value import compute_net_value_tool
from app.tools.price_trend import get_price_trend
from app.tools.route import get_route
from app.tools.weather import get_weather

log = structlog.get_logger()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Simple agent implementations ──────────────────────────────────────────────

class IntakeAgent(BaseAgent):
    name = "intake"
    display_name = "Intake Processor"
    role = "Voice & Text Parser"
    system_prompt_template = INTAKE_SYSTEM
    allowed_tools = ["geocode"]
    model_tier = "primary"


class MandiAgent(BaseAgent):
    name = "mandi"
    display_name = "Price Scout"
    role = "Mandi Arbitrage"
    system_prompt_template = MANDI_SYSTEM
    allowed_tools = ["get_mandi_prices", "compute_net_value"]
    model_tier = "small"


class LogisticsAgent(BaseAgent):
    name = "logistics"
    display_name = "Route Planner"
    role = "Logistics & Fuel"
    system_prompt_template = LOGISTICS_SYSTEM
    allowed_tools = ["get_route", "compute_net_value"]
    model_tier = "small"


class RiskAgent(BaseAgent):
    name = "risk"
    display_name = "Weather Watch"
    role = "Risk & Moisture"
    system_prompt_template = RISK_SYSTEM
    allowed_tools = ["get_weather"]
    model_tier = "small"


class AnalystAgent(BaseAgent):
    name = "analyst"
    display_name = "Market Analyst"
    role = "Trends & Timing"
    system_prompt_template = ANALYST_SYSTEM
    allowed_tools = ["get_price_trend", "get_msp", "get_mandi_prices"]
    model_tier = "primary"


class NegotiatorAgent(BaseAgent):
    name = "negotiator"
    display_name = "Advisor Chair"
    role = "Consensus Engine"
    system_prompt_template = NEGOTIATOR_SYSTEM
    allowed_tools = []  # No tools — reads collected results
    model_tier = "primary"


# ── Tool registry ─────────────────────────────────────────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_mandi_prices",
            "description": "Fetch mandi prices from Agmarknet for a crop and state",
            "parameters": {
                "type": "object",
                "properties": {
                    "crop": {"type": "string"},
                    "state": {"type": "string"},
                    "district": {"type": "string"},
                },
                "required": ["crop", "state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compute_net_value",
            "description": "Compute gross, freight, and net value for selling a crop at a mandi",
            "parameters": {
                "type": "object",
                "properties": {
                    "modal_price": {"type": "number"},
                    "quantity_quintals": {"type": "number"},
                    "distance_km": {"type": "number"},
                    "vehicle_type": {"type": "string", "enum": ["pickup", "truck", "heavy"]},
                    "quality_grade": {"type": "string", "enum": ["A", "B", "C"]},
                    "user_transport_cost_per_km": {"type": "number"},
                    "spoilage_pct": {"type": "number"},
                },
                "required": ["modal_price", "quantity_quintals", "distance_km"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_route",
            "description": "Get driving route between two coordinates",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin_lat": {"type": "number"},
                    "origin_lon": {"type": "number"},
                    "dest_lat": {"type": "number"},
                    "dest_lon": {"type": "number"},
                },
                "required": ["origin_lat", "origin_lon", "dest_lat", "dest_lon"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get 5-day weather forecast for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number"},
                    "lon": {"type": "number"},
                },
                "required": ["lat", "lon"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_price_trend",
            "description": "Get historical price trend for a crop at a mandi",
            "parameters": {
                "type": "object",
                "properties": {
                    "crop": {"type": "string"},
                    "mandi_raw": {"type": "string"},
                    "days": {"type": "integer"},
                },
                "required": ["crop"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_msp",
            "description": "Get Minimum Support Price for a crop",
            "parameters": {
                "type": "object",
                "properties": {"crop": {"type": "string"}},
                "required": ["crop"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "geocode",
            "description": "Geocode a place name to latitude/longitude",
            "parameters": {
                "type": "object",
                "properties": {"place": {"type": "string"}},
                "required": ["place"],
            },
        },
    },
]


# ── Main orchestrator ─────────────────────────────────────────────────────────

async def run_sabha(sabha_id: str, provider: Optional[LLMProvider] = None) -> None:
    """Main orchestration coroutine. Runs as a background task."""
    from app.db import AsyncSessionLocal
    from app.models import Sabha

    prov = provider or llm_provider
    log.info("sabha_started", sabha_id=sabha_id)

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                __import__("sqlalchemy", fromlist=["select"]).select(Sabha).where(Sabha.id == sabha_id)
            )
            sabha = result.scalar_one_or_none()
            if not sabha:
                log.error("sabha_not_found", sabha_id=sabha_id)
                return

            draft = sabha.draft
            user_result = await db.execute(
                __import__("sqlalchemy", fromlist=["select"]).select(
                    __import__("app.models", fromlist=["User"]).User
                ).where(
                    __import__("app.models", fromlist=["User"]).User.id == sabha.user_id
                )
            )
            user = user_result.scalar_one_or_none()

        await _run_orchestration(sabha_id, draft, user, prov)

    except Exception as exc:
        log.error("sabha_orchestration_failed", sabha_id=sabha_id, error=str(exc))
        await _mark_failed(sabha_id, str(exc))
        await emit_event(sabha_id, "error", {"message": str(exc), "recoverable": False})
        await emit_event(sabha_id, "done", {"sabhaId": sabha_id, "status": "failed"})


async def _run_orchestration(sabha_id: str, draft: dict, user, provider: LLMProvider) -> None:
    from app.db import AsyncSessionLocal
    from app.models import Sabha
    from sqlalchemy import update

    crop = draft["crop"]
    quantity = draft["quantity"]
    location_text = draft.get("location", "")
    urgency = draft.get("urgency", "today")
    vehicle_type = draft.get("vehicleType", getattr(user, "vehicle_type", None) or "pickup")
    quality_grade = draft.get("qualityGrade")
    target_mandi = draft.get("targetMandi")
    radius = draft.get("radius", 200)
    language = getattr(user, "language", "en") or "en"

    # Mark running
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Sabha).where(Sabha.id == sabha_id).values(status="running")
        )
        await db.commit()

    # Emit agent_registered events (5 agents visible to frontend)
    agents_info = [
        {"name": "Price Scout", "role": "Mandi Arbitrage", "agentId": "price_scout"},
        {"name": "Route Planner", "role": "Logistics & Fuel", "agentId": "route_planner"},
        {"name": "Weather Watch", "role": "Risk & Moisture", "agentId": "weather_watch"},
        {"name": "Market Analyst", "role": "Trends & Timing", "agentId": "market_analyst"},
        {"name": "Advisor Chair", "role": "Consensus Engine", "agentId": "negotiator"},
    ]
    await emit_event(sabha_id, "agent_registered", {"agents": agents_info})
    await emit_event(sabha_id, "progress", {"percent": 5, "step": "Resolving origin", "agentIndex": 0, "agentCount": 5})

    # ── Step 1: Resolve origin ────────────────────────────────────────────────
    origin_lat = None
    origin_lon = None
    origin_label = location_text
    origin_source = "provided"

    # 1. Check explicit coords from draft
    draft_coords = draft.get("origin_coords") or draft.get("originCoords")
    if draft_coords and len(draft_coords) == 2:
        origin_lat = float(draft_coords[0])
        origin_lon = float(draft_coords[1])
        origin_source = "draft_coords"

    # 2. Geocode explicit location text from draft if present
    if not origin_lat and location_text and location_text.strip():
        geo_result = await geocode(location_text.strip())
        if geo_result.ok and geo_result.data:
            origin_lat = float(geo_result.data["lat"])
            origin_lon = float(geo_result.data["lon"])
            origin_label = geo_result.data.get("display_name", location_text)
            origin_source = "geocoded"

    # 3. Fallback to user profile home coords
    if not origin_lat and user and user.home_lat and user.home_lon:
        origin_lat = float(user.home_lat)
        origin_lon = float(user.home_lon)
        origin_source = "profile"

    if not origin_lat:
        # Try village+district from profile
        if user and user.village:
            place = f"{user.village}, {user.district or ''}, {user.state or 'India'}"
            geo_result = await geocode(place)
            if geo_result.ok:
                origin_lat = geo_result.data["lat"]
                origin_lon = geo_result.data["lon"]
                origin_label = geo_result.data.get("display_name", place)
                origin_source = "profile_geocoded"

    if not origin_lat:
        log.warning("origin_not_resolved", sabha_id=sabha_id, location=location_text)

    # ── Step 2: Find nearby mandis ────────────────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 15, "step": "Finding candidate mandis", "agentIndex": 0, "agentCount": 5})

    async with AsyncSessionLocal() as db2:
        candidate_mandis = []
        if origin_lat:
            candidate_mandis = await find_nearby_mandis_in_directory(
                db2, origin_lat, origin_lon, radius, must_include_id=target_mandi
            )

    if not candidate_mandis:
        log.warning("no_candidate_mandis", sabha_id=sabha_id)

    # Limit to MAX_CANDIDATE_MANDIS + target_mandi
    top_mandis = candidate_mandis[:settings.max_candidate_mandis]

    # ── Step 3: Fetch prices per state ────────────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 25, "step": "Fetching prices (Price Scout)", "agentIndex": 0, "agentCount": 5})
    await emit_event(sabha_id, "agent_started", {"agent": "price_scout", "displayName": "Price Scout"})

    # Derive states from candidates
    candidate_states = list({m.state for m in top_mandis}) if top_mandis else []
    if user and user.state and user.state not in candidate_states:
        candidate_states.append(user.state)

    price_results: dict[str, dict] = {}  # state -> price data
    for state in candidate_states[:4]:  # limit states
        pr = await get_mandi_prices(crop, state)
        if pr.ok and pr.data:
            price_results[state] = pr

    # ── Step 4: Compute economics per mandi ──────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 40, "step": "Computing logistics (Route Planner)", "agentIndex": 1, "agentCount": 5})
    await emit_event(sabha_id, "agent_started", {"agent": "route_planner", "displayName": "Route Planner"})

    mandi_options = []
    user_rate = getattr(user, "transport_cost_per_km", None)
    if user_rate:
        user_rate = float(user_rate)

    for mandi in top_mandis:
        # Find price for this mandi
        state_data = price_results.get(mandi.state, {})
        records = state_data.data if hasattr(state_data, "data") else []

        # Match to this mandi
        mandi_prices = [
            r for r in records
            if mandi.name.lower() in r.get("market", "").lower()
            or r.get("market", "").lower() in mandi.name.lower()
        ]

        if not mandi_prices:
            # Match by district
            mandi_prices = [
                r for r in records
                if mandi.district and (
                    mandi.district.lower() in r.get("district", "").lower()
                    or r.get("district", "").lower() in mandi.district.lower()
                )
            ]

        if not mandi_prices and records:
            # Fallback to state-level commodity record
            mandi_prices = records

        if not mandi_prices:
            continue

        # Use best (highest modal) record
        best = max(mandi_prices, key=lambda r: r.get("modal_price", 0))
        modal = best["modal_price"]
        min_p = best["min_price"]
        max_p = best["max_price"]
        price_date = best.get("price_date")

        # Get route
        dist_km = 100.0  # default
        duration_min = 120.0
        route_method = "estimate"
        route_geometry = {"type": "LineString", "coordinates": []}

        if origin_lat and mandi.lat and mandi.lon:
            route_result = await get_route(origin_lat, origin_lon, float(mandi.lat), float(mandi.lon))
            if route_result.ok:
                dist_km = route_result.data["distance_km"]
                duration_min = route_result.data["duration_min"]
                route_method = route_result.data["method"]
                route_geometry = route_result.data.get("geometry", route_geometry)
        elif origin_lat and mandi.lat and mandi.lon:
            dist_km = haversine_km(origin_lat, origin_lon, float(mandi.lat), float(mandi.lon)) * 1.3

        # Compute economics
        econ_input = EconomicsInput(
            modal_price=modal,
            quantity_quintals=quantity,
            distance_km=dist_km,
            vehicle_type=vehicle_type,
            quality_grade=quality_grade,
            user_transport_cost_per_km=user_rate,
            spoilage_pct=0.0,  # will be updated by risk agent
        )
        econ = compute_net_value(econ_input)

        mandi_options.append({
            "mandiId": mandi.id,
            "name": mandi.name,
            "district": mandi.district,
            "state": mandi.state,
            "lat": float(mandi.lat) if mandi.lat else None,
            "lon": float(mandi.lon) if mandi.lon else None,
            "coordsSource": mandi.coords_source,
            "distanceKm": dist_km,
            "durationMin": duration_min,
            "routeMethod": route_method,
            "routeGeometry": route_geometry,
            "modalPrice": modal,
            "minPrice": min_p,
            "maxPrice": max_p,
            "priceDate": price_date.isoformat() if hasattr(price_date, "isoformat") else str(price_date) if price_date else None,
            "priceSource": state_data.source if hasattr(state_data, "source") else "live",
            "stale": state_data.stale if hasattr(state_data, "stale") else False,
            "arrivalsQty": best.get("arrivals_qty"),
            "grossTotal": float(econ.gross_total),
            "freightTotal": float(econ.freight_total),
            "tollsTotal": float(econ.tolls_total),
            "loadingTotal": float(econ.loading_total),
            "commissionTotal": float(econ.commission_total),
            "spoilageLoss": float(econ.spoilage_loss),
            "netTotal": float(econ.net_total),
            "netPerQuintal": float(econ.net_per_quintal),
            "trips": econ.trips,
            "rateBasis": econ.rate_basis,
            "ratePerKm": float(econ.rate_per_km),
            "warnings": econ.warnings,
        })

    # Sort by netTotal desc
    mandi_options.sort(key=lambda x: x["netTotal"], reverse=True)

    # Emit Price Scout message
    if mandi_options:
        winner = mandi_options[0]
        await emit_event(sabha_id, "agent_message", {
            "agent": "price_scout",
            "message": f"{winner['name']} shows modal ₹{winner['modalPrice']:.0f}/q — highest in your radius.",
        })
    await emit_event(sabha_id, "agent_finished", {"agent": "price_scout"})

    # ── Step 5: Weather / Risk ────────────────────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 60, "step": "Assessing weather risk (Weather Watch)", "agentIndex": 2, "agentCount": 5})
    await emit_event(sabha_id, "agent_started", {"agent": "weather_watch", "displayName": "Weather Watch"})

    weather_risk = "unknown"
    rain_days = []
    spoilage_pct = 0.0
    weather_available = False

    if mandi_options and origin_lat:
        winner_opt = mandi_options[0]
        dest_lat = winner_opt.get("lat")
        dest_lon = winner_opt.get("lon")

        weather_res = await get_weather(origin_lat, origin_lon)
        if weather_res.ok and weather_res.data:
            weather_available = True
            daily = weather_res.data.get("daily", {})
            precip_prob = daily.get("precipitation_probability_max", [])
            precip_dates = daily.get("time", [])
            temp_max = daily.get("temperature_2m_max", [])

            rain_threshold = 50  # %
            for i, prob in enumerate(precip_prob):
                if prob and float(prob) >= rain_threshold:
                    if i < len(precip_dates):
                        rain_days.append(precip_dates[i])

            max_temp = max([float(t) for t in temp_max if t is not None], default=30)

            # Simple perishability heuristic
            transit_hours = winner_opt.get("durationMin", 180) / 60
            if crop in ("Tomato", "Potato"):
                base_spoilage_pct_per_hr = 0.2
            elif crop == "Onion":
                base_spoilage_pct_per_hr = 0.05
            else:
                base_spoilage_pct_per_hr = 0.02

            temp_factor = max(1.0, (max_temp - 25) * 0.1)
            spoilage_pct = min(10.0, base_spoilage_pct_per_hr * transit_hours * temp_factor)

            if len(rain_days) >= 3:
                weather_risk = "high"
            elif len(rain_days) >= 1:
                weather_risk = "medium"
            else:
                weather_risk = "low"

    # Re-compute economics with spoilage
    if mandi_options and spoilage_pct > 0:
        for opt in mandi_options:
            econ_input = EconomicsInput(
                modal_price=opt["modalPrice"],
                quantity_quintals=quantity,
                distance_km=opt["distanceKm"],
                vehicle_type=vehicle_type,
                quality_grade=quality_grade,
                user_transport_cost_per_km=user_rate,
                spoilage_pct=spoilage_pct,
            )
            econ = compute_net_value(econ_input)
            opt["spoilageLoss"] = float(econ.spoilage_loss)
            opt["netTotal"] = float(econ.net_total)
            opt["netPerQuintal"] = float(econ.net_per_quintal)
        mandi_options.sort(key=lambda x: x["netTotal"], reverse=True)

    await emit_event(sabha_id, "agent_message", {
        "agent": "weather_watch",
        "message": f"Weather risk: {weather_risk}. Rain days in 5-day forecast: {len(rain_days)}.",
    })
    await emit_event(sabha_id, "agent_finished", {"agent": "weather_watch"})

    # ── Step 6: Market Analyst ────────────────────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 75, "step": "Trend analysis (Market Analyst)", "agentIndex": 3, "agentCount": 5})
    await emit_event(sabha_id, "agent_started", {"agent": "market_analyst", "displayName": "Market Analyst"})

    timing_action = "sell_now" if urgency == "today" else "wait"
    timing_summary = ""
    msp_data = {}
    history_days = 0

    try:
        msp_result = await get_msp(crop)
        if msp_result.ok:
            msp_data = msp_result.data or {}

        async with AsyncSessionLocal() as db3:
            winner_mandi_id = mandi_options[0]["mandiId"] if mandi_options else None
            trend_result = await get_price_trend(db3, crop, mandi_id=winner_mandi_id, days=30)
            if trend_result.ok and trend_result.data:
                td = trend_result.data
                history_days = td.get("historyDaysAvailable", 0)
                change_7d = td.get("changePct7d")
                if history_days >= 7 and change_7d is not None:
                    direction = "rising" if change_7d > 0 else "falling"
                    timing_summary = f"7-day trend: {direction} ({change_7d:+.1f}%)"
                else:
                    timing_summary = f"Trend not established (only {history_days} day(s) of history)"
                    timing_action = "sell_now" if urgency == "today" else "sell_now"
    except Exception as exc:
        log.warning("analyst_error", error=str(exc))

    msp_per_q = msp_data.get("mspPerQuintal")
    winner_modal = mandi_options[0]["modalPrice"] if mandi_options else 0
    pct_above_msp = None
    if msp_per_q and winner_modal:
        pct_above_msp = round((winner_modal - msp_per_q) / msp_per_q * 100, 1)

    timing_result = {
        "action": timing_action,
        "waitDays": None,
        "trendSummary": timing_summary,
        "vsMsp": {
            "mspPerQuintal": msp_per_q,
            "modal": winner_modal,
            "pctAboveMsp": pct_above_msp,
        },
        "historyDaysAvailable": history_days,
        "rationale": f"Urgency: {urgency}. {timing_summary}",
    }

    await emit_event(sabha_id, "agent_message", {
        "agent": "market_analyst",
        "message": f"Market analysis: {timing_summary or 'Sell now recommended.'}",
    })
    await emit_event(sabha_id, "agent_finished", {"agent": "market_analyst"})

    # ── Step 7: Negotiator / Final verdict ────────────────────────────────────
    await emit_event(sabha_id, "progress", {"percent": 88, "step": "Final verdict (Advisor Chair)", "agentIndex": 4, "agentCount": 5})
    await emit_event(sabha_id, "agent_started", {"agent": "negotiator", "displayName": "Advisor Chair"})

    if not mandi_options:
        await _mark_failed(sabha_id, "No candidate mandis with price data found")
        await emit_event(sabha_id, "error", {
            "message": "No mandi data available. Check API key or try different crop/location.",
            "recoverable": False,
        })
        await emit_event(sabha_id, "done", {"sabhaId": sabha_id, "status": "failed"})
        return

    # Winner is always the highest computed net (server-side, deterministic)
    winner = mandi_options[0]

    # Local baseline: strictly the physically nearest mandi to the farm
    local_baseline = min(mandi_options, key=lambda x: x["distanceKm"]) if mandi_options else None

    surplus_total, surplus_per_q = None, None
    arbitrage_spread_pct = None
    if local_baseline and winner["mandiId"] != local_baseline["mandiId"]:
        from decimal import Decimal
        surplus_total, surplus_per_q = compute_surplus_vs_local(
            Decimal(str(winner["netTotal"])),
            Decimal(str(local_baseline["netTotal"])),
            Decimal(str(quantity)),
        )
        arbitrage_spread_pct = compute_arbitrage_spread_pct(
            winner["modalPrice"], local_baseline["modalPrice"]
        )
    elif local_baseline:
        from decimal import Decimal
        surplus_total = Decimal("0")
        surplus_per_q = Decimal("0")
        arbitrage_spread_pct = 0.0

    # Confidence score
    confidence_factors = []
    if winner.get("stale"):
        confidence_factors.append(("priceFreshness", 15, "Price data is stale"))
    if winner.get("priceSource") == "fixture":
        confidence_factors.append(("dataSource", 20, "Using fixture/sample data"))
    if winner.get("routeMethod") == "estimate":
        confidence_factors.append(("routeEstimate", 10, "Route distance is estimated"))
    if not weather_available:
        confidence_factors.append(("weatherUnavailable", 5, "Weather data unavailable"))
    if len(mandi_options) < 3:
        confidence_factors.append(("fewCandidates", 10, "Fewer than 3 candidate mandis"))
    if history_days < 7:
        confidence_factors.append(("thinHistory", 10, "Less than 7 days of price history"))
    if len(mandi_options) >= 2:
        spread = abs(mandi_options[0]["netTotal"] - mandi_options[1]["netTotal"])
        if spread < mandi_options[0]["modalPrice"] * 0.05:
            confidence_factors.append(("narrowSpread", 5, "Small gap between #1 and #2 mandis"))

    confidence = compute_confidence(confidence_factors)

    # Build transport assumption
    econ_sample = compute_net_value(EconomicsInput(
        modal_price=winner["modalPrice"],
        quantity_quintals=quantity,
        distance_km=winner["distanceKm"],
        vehicle_type=vehicle_type,
        quality_grade=quality_grade,
        user_transport_cost_per_km=user_rate,
        spoilage_pct=spoilage_pct,
    ))

    # Build ranking
    ranking_ids = [m["mandiId"] for m in mandi_options]

    # Add rank to each option and calculate advantage vs local baseline
    for i, opt in enumerate(mandi_options):
        opt["rank"] = i + 1
        baseline_net = local_baseline["netTotal"] if local_baseline else opt["netTotal"]
        opt["advantageVsLocalTotal"] = round(float(opt["netTotal"] - baseline_net), 2)

    # Build final recommendation
    recommendation = {
        "sabhaId": sabha_id,
        "displayCode": None,  # filled below
        "generatedAt": _now().isoformat(),
        "crop": crop,
        "quantityQuintals": quantity,
        "origin": {
            "label": origin_label,
            "lat": origin_lat,
            "lon": origin_lon,
            "source": origin_source,
        },
        "winner": winner,
        "options": mandi_options,
        "localBaseline": local_baseline,
        "surplusVsLocal": {
            "total": float(surplus_total) if surplus_total is not None else None,
            "perQuintal": float(surplus_per_q) if surplus_per_q is not None else None,
        },
        "arbitrageSpreadPct": arbitrage_spread_pct,
        "timing": timing_result,
        "risk": {
            "weatherRisk": weather_risk,
            "spoilagePct": round(spoilage_pct, 2),
            "rainDays": rain_days,
            "notes": ["Spoilage is a heuristic estimate based on transit time and temperature, not measured data"],
        },
        "confidence": confidence,
        "agentVotes": [{"agent": "negotiator", "votes": winner["mandiId"], "agrees": True}],
        "route": {
            "geometry": winner.get("routeGeometry", {"type": "LineString", "coordinates": []}),
            "distanceKm": winner["distanceKm"],
            "durationMin": winner.get("durationMin"),
            "method": winner.get("routeMethod", "estimate"),
        },
        "transportAssumption": {
            "ratePerKm": float(econ_sample.rate_per_km),
            "rateBasis": econ_sample.rate_basis,
            "vehicleType": vehicle_type,
            "vehicleCapacityQuintals": econ_sample.vehicle_capacity_quintals,
            "trips": econ_sample.trips,
            "returnLegFactor": econ_sample.return_leg_factor,
            "tollsIncluded": settings.toll_per_km > 0,
            "loadingIncluded": settings.loading_cost_per_q > 0,
            "commissionIncluded": settings.commission_pct > 0,
            "statement": econ_sample.transport_assumption_statement,
        },
        "notIncluded": econ_sample.not_included,
        "assumptions": [
            econ_sample.transport_assumption_statement,
            "Spoilage is a documented heuristic, not measured data.",
            f"Grade {quality_grade} multiplier: {econ_sample.grade_multiplier}×" if quality_grade else "No quality grade applied.",
        ],
        "dataAsOf": winner.get("priceDate"),
        "sources": [{"name": "Agmarknet via data.gov.in", "fetchedAt": _now().isoformat(), "source": winner.get("priceSource", "live")}],
        "isSample": winner.get("priceSource") == "fixture",
        "disclaimer": "Estimate from published mandi prices; actual realization may differ.",
    }

    # Persist recommendation
    async with AsyncSessionLocal() as db4:
        result4 = await db4.execute(
            __import__("sqlalchemy", fromlist=["select"]).select(Sabha).where(Sabha.id == sabha_id)
        )
        sabha4 = result4.scalar_one_or_none()
        if sabha4:
            recommendation["displayCode"] = sabha4.display_code
            sabha4.recommendation = recommendation
            sabha4.status = "completed"
            sabha4.finished_at = _now()
            await db4.commit()

    await emit_event(sabha_id, "agent_message", {
        "agent": "negotiator",
        "message": f"Recommendation: {winner['name']}. Net payout ₹{winner['netTotal']:.0f}.",
    })
    await emit_event(sabha_id, "agent_finished", {"agent": "negotiator"})
    await emit_event(sabha_id, "progress", {"percent": 100, "step": "Complete", "agentIndex": 4, "agentCount": 5})
    await emit_event(sabha_id, "recommendation", {"recommendation": recommendation})
    await emit_event(sabha_id, "done", {"sabhaId": sabha_id, "status": "completed"})

    log.info("sabha_completed", sabha_id=sabha_id, winner=winner["name"])


async def _mark_failed(sabha_id: str, error: str) -> None:
    from app.db import AsyncSessionLocal
    from app.models import Sabha
    from sqlalchemy import update

    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Sabha)
            .where(Sabha.id == sabha_id)
            .values(status="failed", error=error, finished_at=_now())
        )
        await db.commit()
