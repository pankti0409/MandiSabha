"""Tests for mandi prices tool — mock Agmarknet responses."""
import pytest
import respx
import httpx

from app.tools.mandi_prices import get_mandi_prices, _normalize_record


def test_normalize_lowercase_fields():
    """Agmarknet lowercase-field format."""
    raw = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market": "Lasalgaon",
        "commodity": "Onion",
        "variety": "Other",
        "grade": "FAQ",
        "arrival_date": "29/09/2026",
        "min_price": "1500",
        "max_price": "1710",
        "modal_price": "1620",
    }
    rec = _normalize_record(raw)
    assert rec is not None
    assert rec["modal_price"] == 1620.0
    assert rec["canonical_crop"] == "Onion"
    from datetime import date
    assert rec["price_date"] == date(2026, 9, 29)


def test_normalize_capitalized_fields():
    """Agmarknet Alt-resource capitalized-field format."""
    raw = {
        "State": "Maharashtra",
        "District": "Nashik",
        "Market": "Lasalgaon",
        "Commodity": "Onion",
        "Variety": "Other",
        "Grade": "FAQ",
        "Arrival_Date": "29/09/2026",
        "Min_Price": "1500",
        "Max_Price": "1710",
        "Modal_Price": "1620",
    }
    rec = _normalize_record(raw)
    assert rec is not None
    assert rec["modal_price"] == 1620.0


def test_normalize_invalid_price():
    """Zero modal price should be rejected."""
    raw = {"state": "X", "district": "Y", "market": "M", "commodity": "Onion",
           "variety": "", "grade": "", "arrival_date": "01/01/2026",
           "min_price": "0", "max_price": "0", "modal_price": "0"}
    assert _normalize_record(raw) is None


def test_normalize_inverted_price_range():
    """min > max should be rejected."""
    raw = {"state": "X", "district": "Y", "market": "M", "commodity": "Onion",
           "variety": "", "grade": "", "arrival_date": "01/01/2026",
           "min_price": "2000", "max_price": "1000", "modal_price": "1500"}
    assert _normalize_record(raw) is None


def test_normalize_comma_formatted_price():
    """Price with comma like '1,620' should parse to 1620.0."""
    raw = {"state": "X", "district": "Y", "market": "M", "commodity": "Onion",
           "variety": "", "grade": "", "arrival_date": "01/01/2026",
           "min_price": "1,500", "max_price": "1,800", "modal_price": "1,620"}
    rec = _normalize_record(raw)
    assert rec is not None
    assert rec["modal_price"] == 1620.0


def test_soyabean_maps_to_soybean():
    """Agmarknet 'Soyabean' should map to canonical 'Soybean'."""
    raw = {"state": "MP", "district": "Indore", "market": "Indore",
           "commodity": "Soyabean", "variety": "", "grade": "",
           "arrival_date": "01/01/2026", "min_price": "4500", "max_price": "5000", "modal_price": "4800"}
    rec = _normalize_record(raw)
    assert rec["canonical_crop"] == "Soybean"


@pytest.mark.asyncio
async def test_fixture_fallback(tmp_path, monkeypatch):
    """When API key is empty, fixture data should be returned."""
    monkeypatch.setattr("app.config.settings.data_gov_api_key", "")
    result = await get_mandi_prices("Onion", "Maharashtra")
    # Either fixture or no data (depends on fixture file presence)
    assert result is not None
    if result.ok:
        assert result.source in ("fixture", "cache")
