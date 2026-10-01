"""Unit tests for tool layer with respx mocks."""
import httpx
import pytest
import respx

from app.config import settings
from app.models import Mandi
from app.tools.geocode import geocode, reverse_geocode
from app.tools.mandi_prices import deduplicate_prices_by_mandi, get_mandi_prices
from app.tools.nearby_mandis import find_candidate_mandis
from app.tools.route import get_route
from app.tools.weather import get_weather


@pytest.mark.asyncio
@respx.mock
async def test_route_osrm_success(db_session):
    """OSRM routing returns live distance and duration."""
    respx.get(url__startswith=f"{settings.osrm_base_url}/route/v1/driving/").respond(
        status_code=200,
        json={
            "code": "Ok",
            "routes": [{
                "distance": 142000.0,
                "duration": 10800.0,
                "geometry": {"type": "LineString", "coordinates": [[73.8, 20.0], [72.8, 21.1]]}
            }]
        }
    )

    res = await get_route(20.0, 73.8, 21.1, 72.8)
    assert res.ok
    assert res.source == "live"
    assert res.data["distance_km"] == 142.0
    assert res.data["duration_min"] == 180.0
    assert res.data["method"] == "osrm"


@pytest.mark.asyncio
@respx.mock
async def test_route_osrm_fallback_haversine(db_session):
    """When OSRM fails, route falls back to haversine*1.3 estimate with warning."""
    respx.get(url__startswith=f"{settings.osrm_base_url}/route/v1/driving/").respond(
        status_code=500
    )

    res = await get_route(20.0, 73.8, 21.1, 72.8)
    assert res.ok
    assert res.source == "estimate"
    assert res.data["method"] == "estimate"
    assert res.data["distance_km"] > 0
    assert any("haversine×1.3 estimate" in w for w in res.warnings)


@pytest.mark.asyncio
@respx.mock
async def test_geocode_nominatim_success(db_session):
    """Nominatim geocoding returns lat and lon."""
    respx.get(url__startswith=f"{settings.nominatim_base_url}/search").respond(
        status_code=200,
        json=[{
            "lat": "20.0063",
            "lon": "73.7912",
            "display_name": "Nashik, Maharashtra, India",
            "type": "city",
        }]
    )

    res = await geocode("Nashik")
    assert res.ok
    assert res.source == "live"
    assert res.data["lat"] == 20.0063
    assert res.data["lon"] == 73.7912


@pytest.mark.asyncio
@respx.mock
async def test_geocode_fallback_seed(db_session):
    """When Nominatim fails, geocode falls back to mandi directory seed."""
    mandi = Mandi(
        id="lasalgaon-mh",
        name="Lasalgaon APMC",
        aliases=["Lasalgaon"],
        state="Maharashtra",
        district="Nashik",
        lat=20.1472,
        lon=74.2268,
        coords_source="curated",
        verified=True,
    )
    db_session.add(mandi)
    await db_session.commit()

    respx.get(url__startswith=f"{settings.nominatim_base_url}/search").respond(
        status_code=503
    )

    res = await geocode("Lasalgaon")
    assert res.ok
    assert res.source == "local"
    assert res.data["lat"] == 20.1472
    assert res.data["lon"] == 74.2268


@pytest.mark.asyncio
@respx.mock
async def test_mandi_prices_data_gov_network_failure_fallback(db_session):
    """When api.data.gov.in network fails (e.g. WinError 10061), resilient fallback activates."""
    respx.get(url__startswith="https://api.data.gov.in/resource/").mock(
        side_effect=httpx.ConnectError("Connection refused [WinError 10061]")
    )
    respx.get(url__startswith="https://agmarknet.gov.in").respond(
        status_code=502
    )

    res = await get_mandi_prices("Onion", "Maharashtra")
    assert res.ok
    assert res.source in ("fixture", "cache")
    assert len(res.data) > 0
    assert any("unroutable" in w for w in res.warnings)


def test_deduplicate_prices_by_mandi():
    """Deduplication ensures only the latest price record is kept per unique market."""
    records = [
        {"state": "Maharashtra", "market": "Lasalgaon", "price_date": "2026-09-27", "modal_price": 2000},
        {"state": "Maharashtra", "market": "Lasalgaon", "price_date": "2026-09-29", "modal_price": 2140},
        {"state": "Gujarat", "market": "Surat", "price_date": "2026-09-29", "modal_price": 2600},
    ]

    deduped = deduplicate_prices_by_mandi(records)
    assert len(deduped) == 2
    lasalgaon_rec = next(r for r in deduped if r["market"] == "Lasalgaon")
    assert lasalgaon_rec["modal_price"] == 2140
    assert lasalgaon_rec["price_date"] == "2026-09-29"


@pytest.mark.asyncio
async def test_nearby_mandis_candidate_discovery(db_session):
    """Candidate mandis identification tool finds up to 5 mandis within radius."""
    mandis = [
        Mandi(id="lasalgaon-mh", name="Lasalgaon APMC", state="Maharashtra", district="Nashik", lat=20.1472, lon=74.2268),
        Mandi(id="pimpalgaon-mh", name="Pimpalgaon APMC", state="Maharashtra", district="Nashik", lat=20.1706, lon=73.9856),
        Mandi(id="nashik-mh", name="Nashik APMC", state="Maharashtra", district="Nashik", lat=20.0063, lon=73.7912),
        Mandi(id="pune-mh", name="Pune Market Yard", state="Maharashtra", district="Pune", lat=18.4890, lon=73.8654),
        Mandi(id="surat-gj", name="Surat APMC", state="Gujarat", district="Surat", lat=21.1926, lon=72.8541),
        Mandi(id="indore-mp", name="Indore Mandi", state="Madhya Pradesh", district="Indore", lat=22.7533, lon=75.8458),
    ]
    for m in mandis:
        db_session.add(m)
    await db_session.commit()

    res = await find_candidate_mandis("Onion", origin_lat=20.0, origin_lon=73.8, radius_km=250.0, limit=5)
    assert res.ok
    assert len(res.data) <= 5
    # First candidate should be the closest (Nashik)
    assert res.data[0]["id"] == "nashik-mh"


@pytest.mark.asyncio
async def test_nearby_mandis_must_include(db_session):
    """Must-include mandi is always included in the candidate list."""
    mandis = [
        Mandi(id="lasalgaon-mh", name="Lasalgaon APMC", state="Maharashtra", district="Nashik", lat=20.1472, lon=74.2268),
        Mandi(id="pune-mh", name="Pune Market Yard", state="Maharashtra", district="Pune", lat=18.4890, lon=73.8654),
        Mandi(id="kota-rj", name="Kota Mandi", state="Rajasthan", district="Kota", lat=25.1388, lon=75.8714),
    ]
    for m in mandis:
        db_session.add(m)
    await db_session.commit()

    res = await find_candidate_mandis("Wheat", origin_lat=20.0, origin_lon=73.8, radius_km=150.0, must_include_id="kota-rj")
    assert res.ok
    ids = [m["id"] for m in res.data]
    assert "kota-rj" in ids


@pytest.mark.asyncio
@respx.mock
async def test_weather_tool_success(db_session):
    """Open-Meteo weather tool returns 5-day forecast."""
    respx.get(url__startswith=f"{settings.open_meteo_base_url}/forecast").respond(
        status_code=200,
        json={
            "daily": {
                "time": ["2026-09-30", "2026-10-01"],
                "temperature_2m_max": [31.5, 30.2],
                "temperature_2m_min": [21.0, 20.5],
                "precipitation_sum": [0.0, 5.2],
                "precipitation_probability_max": [10, 65],
            }
        }
    )

    res = await get_weather(20.0, 73.8)
    assert res.ok
    assert res.source == "live"
    assert "daily" in res.data


@pytest.mark.asyncio
@respx.mock
async def test_weather_tool_failure(db_session):
    """When weather API fails and no cache exists, returns ok=False without crashing."""
    respx.get(url__startswith=f"{settings.open_meteo_base_url}/forecast").respond(
        status_code=500
    )

    res = await get_weather(12.34, 56.78)
    assert not res.ok
    assert "Weather unavailable" in res.error


@pytest.mark.asyncio
@respx.mock
async def test_reverse_geocode_nominatim_success(db_session):
    """Nominatim reverse geocoding returns village, district, state."""
    respx.get(url__startswith=f"{settings.nominatim_base_url}/reverse").respond(
        status_code=200,
        json={
            "lat": "20.17",
            "lon": "73.98",
            "display_name": "Pimpalgaon Baswant, Niphad, Nashik, Maharashtra, India",
            "address": {
                "village": "Pimpalgaon Baswant",
                "state_district": "Nashik",
                "state": "Maharashtra",
                "postcode": "422209",
            },
        },
    )

    res = await reverse_geocode(20.17, 73.98)
    assert res.ok
    assert res.source == "live"
    assert res.data["village"] == "Pimpalgaon Baswant"
    assert res.data["district"] == "Nashik"
    assert res.data["state"] == "Maharashtra"
    assert "Pimpalgaon Baswant, Nashik" in res.data["display_name"]


@pytest.mark.asyncio
@respx.mock
async def test_reverse_geocode_fallback_seed(db_session):
    """When Nominatim reverse geocode fails, falls back to closest seed mandi."""
    mandi = Mandi(
        id="pimpalgaon-mh",
        name="Pimpalgaon APMC",
        aliases=["Pimpalgaon"],
        state="Maharashtra",
        district="Nashik",
        lat=20.17,
        lon=73.98,
        coords_source="curated",
        verified=True,
    )
    db_session.add(mandi)
    await db_session.commit()

    respx.get(url__startswith=f"{settings.nominatim_base_url}/reverse").respond(
        status_code=503
    )

    res = await reverse_geocode(20.171, 73.981)
    assert res.ok
    assert res.source == "local"
    assert res.data["district"] == "Nashik"
    assert res.data["state"] == "Maharashtra"
    assert any("fell back to nearest" in w for w in res.warnings)


@pytest.mark.asyncio
@respx.mock
async def test_reverse_geocode_endpoint_live(client, db_session):
    """GET /markets/reverse-geocode endpoint returns camelCase response without auth."""
    respx.get(url__startswith=f"{settings.nominatim_base_url}/reverse").respond(
        status_code=200,
        json={
            "lat": "20.0",
            "lon": "73.8",
            "display_name": "Nashik, Maharashtra, India",
            "address": {
                "city": "Nashik",
                "state_district": "Nashik",
                "state": "Maharashtra",
            },
        },
    )

    resp = await client.get("/markets/reverse-geocode?lat=20.0&lon=73.8")
    assert resp.status_code == 200
    data = resp.json()
    assert data["district"] == "Nashik"
    assert data["state"] == "Maharashtra"
    assert "Nashik" in data["displayName"]

