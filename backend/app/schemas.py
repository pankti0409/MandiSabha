"""Pydantic v2 schemas — camelCase aliases for frontend compatibility.

All request/response bodies use camelCase keys (matching TypeScript types).
Python code stays snake_case internally.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model with camelCase alias generation."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ── Auth schemas ──────────────────────────────────────────────────────────────

class CropDetailSchema(CamelModel):
    name: str
    acres: float
    harvest_month: str
    variety: Optional[str] = None
    is_primary: Optional[bool] = None


class UserOut(CamelModel):
    id: str
    name: str
    mobile: str
    village: str
    district: str
    state: Optional[str] = None
    language: Literal["en", "hi", "gu"] = "en"
    crops: list[str] = Field(default_factory=list)
    crop_details: list[CropDetailSchema] = Field(default_factory=list)
    farm_size_acres: Optional[float] = None
    transport_cost_per_km: Optional[float] = None
    vehicle_type: Optional[Literal["pickup", "truck", "heavy"]] = None
    price_alerts: bool = False
    weather_alerts: bool = False
    primary_mandi: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

    @field_validator("crops", "crop_details", mode="before")
    @classmethod
    def normalize_none_to_empty_list(cls, v):
        return v or []


class SignupRequest(CamelModel):
    mobile: str
    name: str
    language: Literal["en", "hi", "gu"] = "en"
    village: str = ""
    district: str = ""
    state: Optional[str] = None
    crops: list[str] = []
    transport_cost_per_km: Optional[float] = None
    vehicle_type: Optional[Literal["pickup", "truck", "heavy"]] = None
    farm_size_acres: Optional[float] = None
    crop_details: Optional[list[CropDetailSchema]] = None

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        import re
        normalized = re.sub(r"\D", "", v)[-10:]
        if not re.match(r"^[6-9]\d{9}$", normalized):
            raise ValueError("Mobile must be a valid 10-digit Indian number (starts with 6-9)")
        return normalized

    @field_validator("transport_cost_per_km")
    @classmethod
    def validate_transport_cost(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 < v <= 200):
            raise ValueError("transportCostPerKm must be between 0 and 200")
        return v


class RequestOtpRequest(CamelModel):
    mobile: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        import re
        normalized = re.sub(r"\D", "", v)[-10:]
        if not re.match(r"^[6-9]\d{9}$", normalized):
            raise ValueError("Mobile must be a valid 10-digit Indian number")
        return normalized


class RequestOtpResponse(CamelModel):
    demo: bool
    resend_after_seconds: int


class VerifyOtpRequest(CamelModel):
    mobile: str
    otp: str
    profile: Optional[dict] = None

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        import re
        normalized = re.sub(r"\D", "", v)[-10:]
        if not re.match(r"^[6-9]\d{9}$", normalized):
            raise ValueError("Mobile must be a valid 10-digit Indian number")
        return normalized

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v


class TokenResponse(CamelModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserOut


class RefreshRequest(CamelModel):
    refresh_token: str


class UpdateMeRequest(CamelModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    language: Optional[Literal["en", "hi", "gu"]] = None
    crops: Optional[list[str]] = None
    crop_details: Optional[list[CropDetailSchema]] = None
    transport_cost_per_km: Optional[float] = None
    vehicle_type: Optional[Literal["pickup", "truck", "heavy"]] = None
    farm_size_acres: Optional[float] = None
    price_alerts: Optional[bool] = None
    weather_alerts: Optional[bool] = None
    primary_mandi: Optional[str] = None

    @field_validator("transport_cost_per_km")
    @classmethod
    def validate_transport_cost(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 < v <= 200):
            raise ValueError("transportCostPerKm must be between 0 and 200")
        return v


# ── Sabha schemas ─────────────────────────────────────────────────────────────

SUPPORTED_CROPS = {
    "Onion", "Tomato", "Wheat", "Potato", "Soybean",
    "Cotton", "Garlic", "Mustard", "Maize"
}


class CreateSabhaRequest(CamelModel):
    crop: str
    quantity: float
    location: str
    urgency: Literal["today", "soon", "week"]
    target_date: Optional[str] = None
    radius: float = 200
    vehicle_type: Optional[Literal["pickup", "truck", "heavy"]] = None
    quality_grade: Optional[Literal["A", "B", "C"]] = None
    target_mandi: Optional[str] = None
    transcript: Optional[str] = None
    language: Optional[str] = None
    origin_coords: Optional[list[float]] = None

    @field_validator("crop")
    @classmethod
    def validate_crop(cls, v: str) -> str:
        if v not in SUPPORTED_CROPS:
            raise ValueError(f"Crop must be one of: {', '.join(sorted(SUPPORTED_CROPS))}")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: float) -> float:
        if not (0 < v <= 5000):
            raise ValueError("Quantity must be between 0 and 5000 quintals")
        return v

    @field_validator("radius")
    @classmethod
    def validate_radius(cls, v: float) -> float:
        if not (10 <= v <= 1500):
            raise ValueError("Radius must be between 10 and 1500 km")
        return v


class SabhaListItem(CamelModel):
    id: str
    display_code: str
    created_at: datetime
    crop: str
    quantity: float
    winner_mandi: Optional[str] = None
    winner_state: Optional[str] = None
    price_per_quintal: Optional[float] = None
    surplus_vs_local: Optional[float] = None
    distance_km: Optional[float] = None
    status: str
    user_status: str


class AskSabhaRequest(CamelModel):
    question: str


class AskSabhaResponse(CamelModel):
    answer: str
    agent: str
    based_on: list[str] = []
    data_as_of: Optional[date] = None


class ApproveRequest(CamelModel):
    channel: Literal["whatsapp", "sms"]
    recipient_mobile: Optional[str] = None
    language: Optional[str] = None


class ApproveResponse(CamelModel):
    channel: str
    url: str
    preview_text: str
    language: str


class CompleteRequest(CamelModel):
    actual_price_per_quintal: Optional[float] = None


class StreamTokenResponse(CamelModel):
    token: str
    expires_in: int


# ── Market schemas ────────────────────────────────────────────────────────────

class MarketPriceRow(CamelModel):
    mandi_id: Optional[str] = None
    mandi: str
    district: str
    state: str
    crop: str
    variety: str
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: Optional[float] = None
    price_date: Optional[date] = None
    change_pct: Optional[float] = None
    trend_5d: list[float] = []
    arrivals_qty: Optional[float] = None
    distance_km: Optional[float] = None
    freight_est_per_quintal: Optional[float] = None
    stale: bool = False
    source: str = "live"


class MarketPricesResponse(CamelModel):
    rows: list[MarketPriceRow]
    total: int
    data_as_of: Optional[date] = None
    fetched_at: Optional[datetime] = None
    source: str
    is_sample: bool = False


class TrendResponse(CamelModel):
    crop: str
    mandi: str
    series: list[dict]
    history_days_available: int
    change_pct_7d: Optional[float] = None
    change_pct_30d: Optional[float] = None
    slope: Optional[float] = None
    volatility: Optional[float] = None
    msp_per_quintal: Optional[float] = None


# ── Voice schemas ─────────────────────────────────────────────────────────────

class ParseVoiceResponse(CamelModel):
    transcript: str
    detected_language: str
    draft: dict
    field_confidence: dict = {}
    assumed_from_profile: list[str] = []
    missing: list[str] = []


class TranscribeResponse(CamelModel):
    transcript: str
    detected_language: str


class SpeakRequest(CamelModel):
    text: str
    language: str


# ── Health schema ─────────────────────────────────────────────────────────────

class HealthResponse(CamelModel):
    status: str
    version: str
    db: str
    upstreams: dict


# ── Geocoding schema ──────────────────────────────────────────────────────────

class ReverseGeocodeResponse(CamelModel):
    village: str
    district: str
    state: str
    display_name: str
    lat: float
    lon: float
    postcode: Optional[str] = None
    source: str = "live"
    warnings: list[str] = Field(default_factory=list)


# ── Error envelope ────────────────────────────────────────────────────────────

class ErrorDetail(CamelModel):
    code: str
    message: str
    request_id: Optional[str] = None
    details: Optional[Any] = None


class ErrorResponse(CamelModel):
    error: ErrorDetail
