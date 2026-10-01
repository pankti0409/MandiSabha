"""JWT creation and verification using python-jose."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt

from app.config import settings

ALGORITHM = "HS256"


def create_access_token(user_id: str) -> tuple[str, int]:
    """Create an access JWT. Returns (token, expires_in_seconds)."""
    expires_in = settings.access_token_ttl_min * 60
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload = {
        "sub": user_id,
        "exp": exp,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    return token, expires_in


def create_refresh_token() -> str:
    """Create a cryptographically random opaque refresh token (not a JWT)."""
    return secrets.token_urlsafe(48)


def create_stream_token(user_id: str, sabha_id: str) -> tuple[str, int]:
    """Create a short-lived single-use stream token for SSE auth."""
    expires_in = 60  # 60 seconds
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload = {
        "sub": user_id,
        "sabha_id": sabha_id,
        "exp": exp,
        "iat": datetime.now(timezone.utc),
        "type": "stream",
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    return token, expires_in


def decode_token(token: str, expected_type: Literal["access", "stream"] = "access") -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    if payload.get("type") != expected_type:
        raise JWTError("Invalid token type")
    return payload
