"""Tests for auth flows."""
import pytest


@pytest.mark.asyncio
async def test_request_otp_unknown_user(client):
    """request-otp for unknown user should return 404."""
    resp = await client.post("/auth/request-otp", json={"mobile": "9999999999"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_signup_flow(client, db_session):
    """Full signup → request-otp → verify-otp flow."""
    mobile = "9876543211"

    # Signup
    resp = await client.post("/auth/signup", json={
        "mobile": mobile,
        "name": "Ramesh",
        "village": "Nashik",
        "district": "Nashik",
        "state": "Maharashtra",
        "language": "hi",
        "crops": ["Onion"],
    })
    assert resp.status_code == 202

    # Verify with fixed dev OTP
    resp2 = await client.post("/auth/verify-otp", json={
        "mobile": mobile,
        "otp": "123456",
        "profile": {"name": "Ramesh"},
    })
    assert resp2.status_code == 200
    data = resp2.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["mobile"] == mobile


@pytest.mark.asyncio
async def test_verify_bad_otp(client):
    """Wrong OTP should return 401."""
    mobile = "9800000001"
    await client.post("/auth/signup", json={
        "mobile": mobile, "name": "Test", "village": "", "district": "",
    })
    resp = await client.post("/auth/verify-otp", json={
        "mobile": mobile,
        "otp": "000000",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_invalid_mobile_rejected(client):
    """Mobile number starting with 1 should be rejected."""
    resp = await client.post("/auth/signup", json={
        "mobile": "1234567890", "name": "Test", "village": "", "district": "",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    resp = await client.get("/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(auth_client):
    ac, user = auth_client
    resp = await ac.get("/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mobile"] == user.mobile


@pytest.mark.asyncio
async def test_update_me(auth_client):
    ac, user = auth_client
    resp = await ac.patch("/me", json={"name": "Updated Name", "language": "hi"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_refresh_token(client, db_session):
    """Refresh token rotation."""
    mobile = "9800000002"
    await client.post("/auth/signup", json={
        "mobile": mobile, "name": "Test", "village": "", "district": "",
    })
    verify_resp = await client.post("/auth/verify-otp", json={
        "mobile": mobile, "otp": "123456",
    })
    data = verify_resp.json()
    refresh_token = data["refreshToken"]

    # Rotate
    resp = await client.post("/auth/refresh", json={"refreshToken": refresh_token})
    assert resp.status_code == 200
    new_data = resp.json()
    assert "accessToken" in new_data
    assert new_data["refreshToken"] != refresh_token

    # Old refresh token should now be invalid
    resp2 = await client.post("/auth/refresh", json={"refreshToken": refresh_token})
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_otp_lockout_after_max_attempts(client):
    """After 5 failed attempts, the OTP challenge should lock out."""
    mobile = "9800000003"
    await client.post("/auth/signup", json={
        "mobile": mobile, "name": "Lockout Test", "village": "", "district": "",
    })

    # Fail 5 times
    for _ in range(5):
        resp = await client.post("/auth/verify-otp", json={
            "mobile": mobile, "otp": "000000",
        })
        assert resp.status_code == 401

    # 6th attempt should be locked out (429)
    resp_locked = await client.post("/auth/verify-otp", json={
        "mobile": mobile, "otp": "000000",
    })
    assert resp_locked.status_code == 429
    assert resp_locked.json()["detail"]["code"] == "too_many_attempts"

