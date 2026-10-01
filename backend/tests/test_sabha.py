"""Tests for sabha creation and status flow."""
import pytest


@pytest.mark.asyncio
async def test_create_sabha_unauthenticated(client):
    resp = await client.post("/sabha", json={
        "crop": "Onion", "quantity": 10, "location": "Nashik", "urgency": "today"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_sabha_invalid_crop(auth_client):
    ac, _ = auth_client
    resp = await ac.post("/sabha", json={
        "crop": "Mushroom", "quantity": 10, "location": "Nashik", "urgency": "today"
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_sabha_invalid_quantity(auth_client):
    ac, _ = auth_client
    resp = await ac.post("/sabha", json={
        "crop": "Onion", "quantity": -5, "location": "Nashik", "urgency": "today"
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_sabha_success(auth_client, monkeypatch):
    """Create sabha returns 202 with id and streamPath."""
    async def _dummy_run_sabha(sabha_id):
        pass

    monkeypatch.setattr("app.agents.orchestrator.run_sabha", _dummy_run_sabha)

    ac, _ = auth_client
    resp = await ac.post("/sabha", json={
        "crop": "Onion", "quantity": 10, "location": "Nashik", "urgency": "today"
    })
    assert resp.status_code == 202
    data = resp.json()
    assert "id" in data
    assert "displayCode" in data
    assert data["status"] == "queued"
    assert "/stream" in data["streamPath"]


@pytest.mark.asyncio
async def test_get_sabha_not_found(auth_client):
    ac, _ = auth_client
    resp = await ac.get("/sabha/nonexistent-id")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sabha_display_code_format(auth_client, monkeypatch):
    """Display code must match SB-YYYY-MMDD-XXXX format."""
    import re

    async def _dummy_run_sabha(sabha_id):
        pass

    monkeypatch.setattr("app.agents.orchestrator.run_sabha", _dummy_run_sabha)

    ac, _ = auth_client
    resp = await ac.post("/sabha", json={
        "crop": "Wheat", "quantity": 5, "location": "Pune", "urgency": "soon"
    })
    data = resp.json()
    assert re.match(r"SB-\d{4}-\d{4}-[A-Z0-9]{4}", data["displayCode"])


@pytest.mark.asyncio
async def test_list_sabhas_empty(auth_client):
    ac, _ = auth_client
    resp = await ac.get("/sabha")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)
