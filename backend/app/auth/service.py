"""Auth service: user creation, OTP lifecycle, token management."""
from __future__ import annotations

import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.otp import generate_otp, hash_otp, send_otp, verify_otp_hash
from app.config import settings
from app.models import OtpChallenge, RefreshToken, User


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_user_by_mobile(db: AsyncSession, mobile: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.mobile == mobile))
    return result.scalar_one_or_none()


async def create_or_update_pending_user(
    db: AsyncSession, mobile: str, profile: dict
) -> User:
    """Create a new pending user or update an existing pending one."""
    existing = await get_user_by_mobile(db, mobile)
    if existing:
        if existing.is_active:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "already_registered", "message": "This number is already registered"},
            )
        # Update pending user
        for field in ("name", "village", "district", "state", "language", "crops",
                      "crop_details", "farm_size_acres", "transport_cost_per_km",
                      "vehicle_type"):
            if field in profile and profile[field] is not None:
                setattr(existing, field, profile[field])
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        user = User(
            mobile=mobile,
            name=profile.get("name", ""),
            village=profile.get("village", ""),
            district=profile.get("district", ""),
            state=profile.get("state"),
            language=profile.get("language", "en"),
            crops=profile.get("crops", []),
            crop_details=profile.get("crop_details", []),
            farm_size_acres=profile.get("farm_size_acres"),
            transport_cost_per_km=profile.get("transport_cost_per_km"),
            vehicle_type=profile.get("vehicle_type"),
            is_active=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


async def create_otp_challenge(db: AsyncSession, mobile: str, ip: Optional[str]) -> OtpChallenge:
    """Generate and persist an OTP challenge."""
    otp = generate_otp()
    code_hash, _ = hash_otp(otp)
    expires_at = _now() + timedelta(seconds=settings.otp_ttl_seconds)

    challenge = OtpChallenge(
        mobile=mobile,
        code_hash=code_hash,
        expires_at=expires_at,
        ip=ip,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    send_otp(mobile, otp)
    return challenge


async def get_latest_challenge(db: AsyncSession, mobile: str) -> Optional[OtpChallenge]:
    result = await db.execute(
        select(OtpChallenge)
        .where(OtpChallenge.mobile == mobile, OtpChallenge.consumed_at.is_(None))
        .order_by(OtpChallenge.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def verify_and_consume_otp(
    db: AsyncSession, mobile: str, otp: str
) -> bool:
    """Verify OTP, increment attempts, consume on success. Returns True on success."""
    from fastapi import HTTPException, status as http_status

    challenge = await get_latest_challenge(db, mobile)
    if not challenge:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail={"code": "no_otp_pending", "message": "No pending OTP for this number"},
        )

    if challenge.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail={"code": "otp_expired", "message": "The code has expired. Request a new one."},
        )

    if challenge.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=http_status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "too_many_attempts", "message": "Too many failed attempts. Request a new OTP."},
        )

    # Increment attempts
    challenge.attempts += 1
    await db.commit()

    if not verify_otp_hash(otp, challenge.code_hash):
        remaining = settings.otp_max_attempts - challenge.attempts
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "invalid_otp",
                "message": f"Incorrect code. {remaining} attempts remaining.",
            },
        )

    # Consume
    challenge.consumed_at = _now()
    await db.commit()
    return True


async def activate_user(db: AsyncSession, mobile: str, profile: Optional[dict]) -> User:
    """Activate a user (or create from profile) after OTP success."""
    user = await get_user_by_mobile(db, mobile)
    if not user:
        if not profile:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail={"code": "user_not_found", "message": "No account found. Please sign up."},
            )
        # Create from profile
        user = User(
            mobile=mobile,
            name=profile.get("name", ""),
            village=profile.get("village", ""),
            district=profile.get("district", ""),
            state=profile.get("state"),
            language=profile.get("language", "en"),
            crops=profile.get("crops", []),
            crop_details=profile.get("cropDetails", profile.get("crop_details", [])),
            farm_size_acres=profile.get("farmSizeAcres", profile.get("farm_size_acres")),
            transport_cost_per_km=profile.get("transportCostPerKm", profile.get("transport_cost_per_km")),
            vehicle_type=profile.get("vehicleType", profile.get("vehicle_type")),
            is_active=True,
        )
        db.add(user)
    else:
        user.is_active = True
        if profile:
            for src_key, db_field in [
                ("name", "name"), ("village", "village"), ("district", "district"),
                ("state", "state"), ("language", "language"), ("crops", "crops"),
                ("farmSizeAcres", "farm_size_acres"), ("transportCostPerKm", "transport_cost_per_km"),
                ("vehicleType", "vehicle_type"),
            ]:
                val = profile.get(src_key)
                if val is not None:
                    setattr(user, db_field, val)

    await db.commit()
    await db.refresh(user)
    return user


async def create_token_pair(db: AsyncSession, user: User) -> tuple[str, str, int]:
    """Create access + refresh token pair and persist the refresh token."""
    access_token, expires_in = create_access_token(user.id)
    raw_refresh = create_refresh_token()

    import secrets
    family = secrets.token_hex(16)
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    expires_at = _now() + timedelta(days=settings.refresh_token_ttl_days)

    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family=family,
        expires_at=expires_at,
    )
    db.add(rt)
    await db.commit()
    return access_token, raw_refresh, expires_in


async def rotate_refresh_token(
    db: AsyncSession, raw_token: str
) -> tuple[str, str, int, User]:
    """Rotate a refresh token. On reuse of revoked token, revoke the whole family."""
    from fastapi import HTTPException, status as http_status

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = result.scalar_one_or_none()

    if not rt:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_refresh_token", "message": "Refresh token not found"},
        )

    if rt.revoked_at is not None:
        # Token reuse detected — revoke the whole family
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family == rt.family, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=_now())
        )
        await db.commit()
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail={"code": "token_reuse", "message": "Refresh token reuse detected. Please log in again."},
        )

    if rt.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail={"code": "refresh_token_expired", "message": "Session expired. Please log in again."},
        )

    # Revoke old token
    rt.revoked_at = _now()

    # Fetch user
    user_result = await db.execute(select(User).where(User.id == rt.user_id, User.is_active == True))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail={"code": "user_not_found", "message": "User not found"},
        )

    # Create new refresh token in same family
    new_raw = create_refresh_token()
    new_hash = hashlib.sha256(new_raw.encode()).hexdigest()
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        family=rt.family,
        expires_at=_now() + timedelta(days=settings.refresh_token_ttl_days),
    )
    db.add(new_rt)
    await db.commit()

    access_token, expires_in = create_access_token(user.id)
    return access_token, new_raw, expires_in, user
