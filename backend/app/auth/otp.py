"""OTP generation, hashing, and console delivery."""
from __future__ import annotations

import hashlib
import os
import secrets

from app.config import settings


def _salt() -> str:
    return secrets.token_hex(16)


def generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    if settings.app_env == "development" and settings.dev_fixed_otp and settings.otp_provider != "smsgate":
        return settings.dev_fixed_otp
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str, salt: str | None = None) -> tuple[str, str]:
    """Hash an OTP with a random salt. Returns (code_hash, salt)."""
    if salt is None:
        salt = _salt()
    hashed = hashlib.sha256(f"{salt}:{otp}".encode()).hexdigest()
    return f"{salt}:{hashed}", salt


def verify_otp_hash(otp: str, stored_hash: str) -> bool:
    """Verify an OTP against its stored hash (salt:hash format)."""
    try:
        salt, _ = stored_hash.split(":", 1)
        expected, _ = hash_otp(otp, salt)
        return secrets.compare_digest(expected, stored_hash)
    except Exception:
        return False


def send_otp(mobile: str, otp: str) -> None:
    """Send the OTP via the configured provider."""
    # Always log to console for development visibility
    separator = "=" * 50
    print(f"\n{separator}")
    print(f"  [OTP] Code for {mobile}: {otp}")
    print(f"  (valid for {settings.otp_ttl_seconds} seconds)")
    print(f"{separator}\n")

    if settings.otp_provider == "smsgate":
        _send_sms_gate(mobile, otp)


def _send_sms_gate(mobile: str, otp: str) -> bool:
    """Send real carrier SMS via SMS Gate Android Gateway."""
    if not (settings.sms_gate_username and settings.sms_gate_password):
        return False

    import httpx

    clean_num = mobile.replace("+", "").strip()
    if len(clean_num) == 10:
        clean_num = "+91" + clean_num
    elif not clean_num.startswith("+"):
        clean_num = "+" + clean_num

    url = f"{settings.sms_gate_url.rstrip('/')}/3rdparty/v1/messages?skipPhoneValidation=true"
    payload = {
        "textMessage": {
            "text": f"Mandi Sabha (વેપાર મિત્ર) verification code: {otp}. Valid for {max(1, settings.otp_ttl_seconds // 60)} minutes. Do not share.",
        },
        "phoneNumbers": [clean_num],
    }
    if settings.sms_gate_device_id:
        payload["deviceId"] = settings.sms_gate_device_id

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                url,
                json=payload,
                auth=(settings.sms_gate_username, settings.sms_gate_password),
            )
            print(f"[SMS-GATE] Dispatched OTP to {clean_num}: status={resp.status_code}")
            return resp.status_code in (200, 201, 202)
    except Exception as e:
        print(f"[SMS-GATE] Failed to send SMS: {e}")
        return False

