"""Tests for Phase 1: health endpoint and DB connectivity."""
import pytest


@pytest.mark.asyncio
async def test_health_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ok", "degraded")
    assert "db" in data
    assert data["db"] == "ok"
    assert "upstreams" in data


@pytest.mark.asyncio
async def test_health_db_status(client):
    resp = await client.get("/health")
    data = resp.json()
    # DB must be reachable in test
    assert data["db"] == "ok"


@pytest.mark.asyncio
async def test_health_no_secrets(client):
    """Health endpoint must not expose API keys."""
    resp = await client.get("/health")
    text = resp.text
    assert "test-key" not in text
    assert "GROQ_API_KEY" not in text
    assert "DATA_GOV_API_KEY" not in text
