"""Auth router — signup, OTP, verify, refresh, logout."""
from __future__ import annotations

import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service as auth_service
from app.auth.deps import get_current_user
from app.auth.jwt import create_stream_token
from app.db import get_db
from app.models import User
from app.schemas import (
    RequestOtpRequest,
    RequestOtpResponse,
    SignupRequest,
    TokenResponse,
    UserOut,
    VerifyOtpRequest,
    RefreshRequest,
)
from app.services.ratelimit import check_otp_rate_limits, check_rate_limit
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_ip(request: Request) -> Optional[str]:
    return request.headers.get("X-Forwarded-For", request.client.host if request.client else None)


@router.post("/signup", status_code=202)
async def signup(body: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Create or update a pending user and send OTP."""
    ip = _get_ip(request)

    # Rate limit OTP sending
    allowed, bucket, retry_after = check_otp_rate_limits(body.mobile, ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": f"Too many OTP requests ({bucket}). Try again later."},
            headers={"Retry-After": str(retry_after)},
        )

    profile = body.model_dump(by_alias=False)
    await auth_service.create_or_update_pending_user(db, body.mobile, profile)
    await auth_service.create_otp_challenge(db, body.mobile, ip)

    return {
        "message": "OTP sent",
        "demo": settings.otp_provider == "console",
        "resendAfterSeconds": settings.otp_resend_cooldown_seconds,
    }


@router.post("/request-otp", response_model=RequestOtpResponse)
async def request_otp(body: RequestOtpRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Request OTP for login (existing active user only)."""
    ip = _get_ip(request)

    allowed, bucket, retry_after = check_otp_rate_limits(body.mobile, ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": f"Too many OTP requests. Try again in {retry_after}s."},
            headers={"Retry-After": str(retry_after)},
        )

    user = await auth_service.get_user_by_mobile(db, body.mobile)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "user_not_found", "message": "No account found. Create one?"},
        )

    await auth_service.create_otp_challenge(db, body.mobile, ip)
    return RequestOtpResponse(
        demo=settings.otp_provider == "console",
        resend_after_seconds=settings.otp_resend_cooldown_seconds,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP, activate user, return tokens."""
    await auth_service.verify_and_consume_otp(db, body.mobile, body.otp)
    user = await auth_service.activate_user(db, body.mobile, body.profile)
    access_token, refresh_token, expires_in = await auth_service.create_token_pair(db, user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh")
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Rotate refresh token."""
    access_token, new_refresh, expires_in, user = await auth_service.rotate_refresh_token(
        db, body.refresh_token
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_in=expires_in,
        user=UserOut.model_validate(user),
    )


@router.post("/logout")
async def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke refresh token."""
    import hashlib
    from sqlalchemy import update
    from app.models import RefreshToken
    from datetime import datetime, timezone

    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"message": "Logged out"}
