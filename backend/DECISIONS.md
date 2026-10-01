# DECISIONS.md — Documented Deviations and Assumptions

> This file is updated as deviations from the build prompt are discovered.
> Each entry references the prompt section it deviates from.

---

## D-001: Python 3.10 instead of 3.11
- **Prompt**: Section 3 specifies Python 3.11+
- **Actual**: Python 3.10.10 found on this system
- **Impact**: No code uses 3.11-specific syntax. `match/case` (3.10+) available. `tomllib` not available (use `json` or `python-dotenv`).
- **Resolution**: Compatible syntax throughout. Upgrade to 3.11 when deploying to production.

## D-002: LLM Model IDs — Must Be Verified via probe_apis.py
- **Prompt**: Section 18 instructs running probe_apis.py before trusting model IDs
- **Defaults set**: `LLM_MODEL_PRIMARY=qwen/qwen3-8b-27b`, `LLM_MODEL_FALLBACK=llama-3.1-70b-versatile`, `LLM_MODEL_SMALL=llama-3.1-8b-instant`
- **Action Required**: Run `python scripts/probe_apis.py` with a real GROQ_API_KEY and update `.env` accordingly
- **Churn handling**: GroqProvider auto-detects 404 on decommissioned models and falls back; see `app/services/llm/groq.py`

## D-003: Rate limiter is in-process, not Redis
- **Prompt**: Implies production-grade rate limiting
- **Actual**: Sliding-window deque in `app/services/ratelimit.py` — resets on restart, not distributed
- **Impact**: Fine for single-process dev/staging. Multi-process Gunicorn/workers will allow 2× requests
- **Upgrade path**: Replace `_windows` dict with a Redis sorted set. API surface is identical.

## D-004: MSP values populated from official PIB/CACP notifications [RESOLVED]
- **Prompt**: Section on Economics references MSP
- **Resolution**: Populated `data/msp.json` with official CCEA/PIB notifications:
  - Wheat: ₹2,425/quintal (RMS 2025-26, PIB PRID 2065363)
  - Soybean: ₹4,892/quintal (KMS 2024-25, PIB PRID 2026880)
  - Cotton: ₹7,121/quintal (KMS 2024-25, PIB PRID 2026880)
  - Mustard: ₹5,950/quintal (RMS 2025-26, PIB PRID 2065363)
  - Maize: ₹2,225/quintal (KMS 2024-25, PIB PRID 2026880)
  - Non-MSP crops (Onion, Tomato, Potato, Garlic) properly return null with explanatory note.
- **Tests**: Verified with 4 dedicated test cases in `tests/test_msp.py`.

## D-005: Mandi directory seed expanded (18 key mandis) [RESOLVED]
- **Prompt**: Expects mandi directory coverage for major trading hubs
- **Actual**: `data/mandis_seed.csv` expanded to 18 verified agricultural market yards across Maharashtra, Gujarat, Madhya Pradesh, and Rajasthan (Lasalgaon, Pimpalgaon, Nashik, Pune, Vashi/Mumbai, Surat, Ahmedabad, Rajkot, Indore, Ujjain, Mandsaur, Kota, Jaipur, Nagpur, Kolhapur, Jalgaon, Solapur, Baramati).
- **Resolution**: Curated high-precision coordinates (`lat`, `lon`), aliases, and districts loaded on startup.

## D-006: Negotiator agent uses deterministic server-side ranking, not LLM consensus
- **Prompt**: Describes a 5-agent deliberation with challenge rounds
- **Actual**: Winner is always the mandi with the highest computed `netTotal` from the deterministic economics engine. The LLM agents contribute enriched data (weather, trends, routing narratives), not the winner selection.
- **Rationale**: Money math must be deterministic (prompt non-negotiable). The LLM-based negotiator is architected but simplified to avoid hallucinated rankings.

## D-007: Voice feature requires SARVAM_API_KEY
- **Prompt**: Voice in/out via Sarvam API
- **Actual**: Voice endpoints return 503 when SARVAM_API_KEY is unset. All other features work without it.

## D-008: CORS `allow_credentials=False`
- **Prompt**: Uses httpOnly cookies (original draft)
- **Actual**: Frontend uses Bearer tokens (not cookies) per the frontend auth.ts examination. CORS credentials disabled as tokens are sent in Authorization header.

## D-009: Alembic initial migration [RESOLVED]
- **Prompt**: Phase 1 includes Alembic migration
- **Resolution**: Created `alembic/script.py.mako` template, generated revision `a8f936dd094f_initial.py`, and executed `alembic upgrade head`. SQLite schema in `mandi.db` is managed by Alembic.

## D-010: api.data.gov.in network unreachability and resilient APMC pipeline
- **Discovery**: TCP handshakes to NIC IP `164.100.61.198:443` actively fail with `WinError 10061` / connection timeout on development networks.
- **Resolution**: Implemented multi-tier resilient fallback in `app/tools/mandi_prices.py`:
  1. `api.data.gov.in` attempted with 4s timeout.
  2. On network failure (`WinError 10061`, `ConnectError`, `TimeoutException`), invokes `scrape_apmc_live_feed` to query public APMC web feeds directly.
  3. If parsed successfully: sets `source="live"`, extracts real dates, and appends warning: `"api.data.gov.in unroutable; retrieved via direct APMC live feed."`
  4. If public feed fails, falls back to `ApiCache` (even if stale), and finally to `data/fixtures/mandi_prices_sample.json` (`source="fixture"`, `stale=True`, `isSample=true`).
  5. The pipeline never crashes on upstream network failures.

## D-011: Vehicle capacities and default placeholder rates
- **Specification**: Pure Python Decimal math in `app/services/economics.py`.
- **Vehicle capacities**: `{"pickup": 15, "truck": 60, "heavy": 150}` quintals.
- **Default rates per km**: `{"pickup": 14, "truck": 28, "heavy": 40}` ₹/km.
- **Return-leg factor**: `RETURN_LEG_FACTOR = 2.0`.
- **Trips formula**: `trips = ceil(quantity / capacity)`.
- **Freight formula**: `freight = trips * distance_km * rate_per_km * 2.0`.
- **Disclosures**: When user rate is not configured, the default placeholder is applied with an explicit warning note.

## D-012: OSRM routing throttle and Haversine estimate fallback
- **Throttle**: Global `asyncio.Semaphore(1)` and monotonic clock tracking to enforce $\le 1.0$ req/s on the public OSRM demo server.
- **Cache**: 7-day TTL in `ApiCache`.
- **Fallback**: If OSRM fails, times out, or returns no routes, distance falls back to `haversine_km * 1.3` with `source="estimate"`, `method="estimate"`, and an explicit disclosure warning.
- **Nominatim Geocoding Throttle**: Global `asyncio.Lock()` enforces $\ge 1.0$ s between requests, falling back to curated mandi seed directory on failure.

## D-013: Arbitrage distinct mandi deduplication
- **Constraint**: The Sabha compares up to 5 distinct candidate mandis on the same day. Multiple historical dates of the same market must never compete against itself.
- **Resolution**: `deduplicate_prices_by_mandi` in `app/tools/mandi_prices.py` groups records by `(state, market)` and selects the most recent `price_date`, ensuring unique market competitors.

---

_Last updated: 2026-09-30_
