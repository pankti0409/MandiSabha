"""Tests for MSP tool."""
import pytest
from app.tools.msp import get_msp


@pytest.mark.asyncio
async def test_get_msp_wheat():
    res = await get_msp("Wheat")
    assert res.ok
    assert res.data["mspPerQuintal"] == 2425
    assert res.data["crop"] == "Wheat"
    assert "PRID=2065363" in res.data["sourceUrl"]


@pytest.mark.asyncio
async def test_get_msp_soybean():
    res = await get_msp("Soybean")
    assert res.ok
    assert res.data["mspPerQuintal"] == 4892


@pytest.mark.asyncio
async def test_get_msp_non_msp_crop():
    res = await get_msp("Onion")
    assert res.ok
    assert res.data["mspPerQuintal"] is None
    assert "no MSP" in res.data["note"]


@pytest.mark.asyncio
async def test_get_msp_unknown_crop():
    res = await get_msp("Dragonfruit")
    assert res.ok
    assert res.data["mspPerQuintal"] is None
