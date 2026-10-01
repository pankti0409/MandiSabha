"""Tests for crop mapping service."""
import pytest

from app.services.crops import to_canonical, to_agmarknet, SUPPORTED_CROPS


def test_canonical_passthrough():
    assert to_canonical("Onion") == "Onion"
    assert to_canonical("Tomato") == "Tomato"


def test_english_alias():
    assert to_canonical("onion") == "Onion"
    assert to_canonical("soya") == "Soybean"
    assert to_canonical("corn") == "Maize"


def test_hindi_alias():
    assert to_canonical("प्याज") == "Onion"
    assert to_canonical("गेहूं") == "Wheat"
    assert to_canonical("सरसों") == "Mustard"


def test_gujarati_alias():
    assert to_canonical("કાંદા") == "Onion"
    assert to_canonical("ઘઉં") == "Wheat"


def test_unknown_returns_none():
    assert to_canonical("Unknown Crop") is None


def test_agmarknet_soybean():
    assert to_agmarknet("Soybean") == "Soyabean"


def test_agmarknet_others():
    assert to_agmarknet("Onion") == "Onion"
    assert to_agmarknet("Wheat") == "Wheat"


def test_all_supported_crops_have_agmarknet_mapping():
    for crop in SUPPORTED_CROPS:
        result = to_agmarknet(crop)
        assert result, f"Crop {crop} has no Agmarknet mapping"
