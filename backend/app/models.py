"""SQLAlchemy 2.0 ORM models — portable types only, Postgres-ready."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    from datetime import timezone
    return datetime.now(timezone.utc)


# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    mobile: Mapped[str] = mapped_column(sa.String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    village: Mapped[str] = mapped_column(sa.String(200), nullable=False, default="")
    district: Mapped[str] = mapped_column(sa.String(200), nullable=False, default="")
    state: Mapped[Optional[str]] = mapped_column(sa.String(200), nullable=True)
    language: Mapped[str] = mapped_column(sa.String(10), nullable=False, default="en")
    crops: Mapped[Any] = mapped_column(sa.JSON, nullable=False, default=list)
    crop_details: Mapped[Any] = mapped_column(sa.JSON, nullable=False, default=list)
    farm_size_acres: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 2), nullable=True)
    transport_cost_per_km: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 2), nullable=True)
    vehicle_type: Mapped[Optional[str]] = mapped_column(sa.String(20), nullable=True)
    price_alerts: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    weather_alerts: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    primary_mandi: Mapped[Optional[str]] = mapped_column(sa.String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(sa.String(200), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(sa.String(500), nullable=True)
    home_lat: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 7), nullable=True)
    home_lon: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 7), nullable=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    sabhas: Mapped[list["Sabha"]] = relationship("Sabha", back_populates="user", lazy="noload")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", lazy="noload"
    )


# ── OTP Challenge ─────────────────────────────────────────────────────────────
class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    mobile: Mapped[str] = mapped_column(sa.String(20), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now
    )
    ip: Mapped[Optional[str]] = mapped_column(sa.String(50), nullable=True)


# ── Refresh Token ─────────────────────────────────────────────────────────────
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(sa.String(200), nullable=False, unique=True)
    family: Mapped[str] = mapped_column(sa.String, nullable=False)  # for rotation reuse detection
    expires_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens", lazy="noload")


# ── Mandi Directory ───────────────────────────────────────────────────────────
class Mandi(Base):
    __tablename__ = "mandis"

    id: Mapped[str] = mapped_column(sa.String(100), primary_key=True)  # slug e.g. "surat-gj"
    name: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    aliases: Mapped[Any] = mapped_column(sa.JSON, nullable=False, default=list)
    state: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    district: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    lat: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 7), nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 7), nullable=True)
    coords_source: Mapped[str] = mapped_column(
        sa.String(20), nullable=False, default="none"
    )  # curated | geocoded | none
    verified: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)


# ── Price Record ──────────────────────────────────────────────────────────────
class PriceRecord(Base):
    __tablename__ = "price_records"
    __table_args__ = (
        sa.UniqueConstraint("mandi_id", "crop", "variety", "grade", "price_date"),
    )

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    mandi_id: Mapped[Optional[str]] = mapped_column(
        sa.String(100), sa.ForeignKey("mandis.id"), nullable=True
    )
    mandi_raw: Mapped[str] = mapped_column(sa.String(200), nullable=False)  # raw name from API
    state: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    district: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    crop: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    variety: Mapped[str] = mapped_column(sa.String(200), nullable=False, default="")
    grade: Mapped[str] = mapped_column(sa.String(50), nullable=False, default="")
    price_date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    min_price: Mapped[float] = mapped_column(sa.Numeric(10, 2), nullable=False)
    max_price: Mapped[float] = mapped_column(sa.Numeric(10, 2), nullable=False)
    modal_price: Mapped[float] = mapped_column(sa.Numeric(10, 2), nullable=False)
    arrivals_qty: Mapped[Optional[float]] = mapped_column(sa.Numeric(12, 2), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="live")


# ── API Cache ─────────────────────────────────────────────────────────────────
class ApiCache(Base):
    __tablename__ = "api_cache"

    key: Mapped[str] = mapped_column(sa.String(500), primary_key=True)
    payload: Mapped[Any] = mapped_column(sa.JSON, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    ttl_seconds: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    source: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="live")


# ── Sabha ─────────────────────────────────────────────────────────────────────
class Sabha(Base):
    __tablename__ = "sabhas"

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    display_code: Mapped[str] = mapped_column(sa.String(30), nullable=False, unique=True)
    user_id: Mapped[str] = mapped_column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        sa.String(20), nullable=False, default="queued"
    )  # queued | running | completed | failed
    draft: Mapped[Any] = mapped_column(sa.JSON, nullable=False)
    recommendation: Mapped[Optional[Any]] = mapped_column(sa.JSON, nullable=True)
    user_status: Mapped[str] = mapped_column(
        sa.String(20), nullable=False, default="none"
    )  # none | approved | sold | cancelled
    actual_price_per_q: Mapped[Optional[float]] = mapped_column(sa.Numeric(10, 2), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    sold_at: Mapped[Optional[datetime]] = mapped_column(sa.DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sabhas", lazy="noload")
    events: Mapped[list["SabhaEvent"]] = relationship(
        "SabhaEvent", back_populates="sabha", lazy="noload", order_by="SabhaEvent.seq"
    )


# ── Sabha Event (SSE log) ─────────────────────────────────────────────────────
class SabhaEvent(Base):
    __tablename__ = "sabha_events"
    __table_args__ = (sa.Index("ix_sabha_events_sabha_seq", "sabha_id", "seq"),)

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    sabha_id: Mapped[str] = mapped_column(
        sa.String, sa.ForeignKey("sabhas.id"), nullable=False, index=True
    )
    seq: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    type: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    payload: Mapped[Any] = mapped_column(sa.JSON, nullable=False)
    ts: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False, default=_now)

    sabha: Mapped["Sabha"] = relationship("Sabha", back_populates="events", lazy="noload")


# ── Voice Usage ───────────────────────────────────────────────────────────────
class VoiceUsage(Base):
    __tablename__ = "voice_usage"
    __table_args__ = (sa.UniqueConstraint("user_id", "day"),)

    id: Mapped[str] = mapped_column(sa.String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(sa.String, sa.ForeignKey("users.id"), nullable=False)
    day: Mapped[date] = mapped_column(sa.Date, nullable=False)
    stt_count: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    tts_count: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)


# ── TTS Cache ─────────────────────────────────────────────────────────────────
class TtsCache(Base):
    __tablename__ = "tts_cache"

    cache_hash: Mapped[str] = mapped_column(sa.String(200), primary_key=True)
    audio_b64: Mapped[str] = mapped_column(sa.Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=_now
    )
