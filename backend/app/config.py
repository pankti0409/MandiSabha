"""Application configuration via pydantic-settings."""
from __future__ import annotations

import json
import os
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_FILE = os.path.join(_BASE_DIR, ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ENV_FILE, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "production"] = "development"
    secret_key: str = "change-me-in-production"
    access_token_ttl_min: int = 60
    refresh_token_ttl_days: int = 30
    database_url: str = "sqlite+aiosqlite:///./mandi.db"
    cors_origins: str = "http://localhost:3000"

    # OTP
    otp_provider: Literal["console", "smsgate"] = "console"
    otp_ttl_seconds: int = 300
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 30
    dev_fixed_otp: str = ""  # dev only

    # SMS Gate (Android SMS Gateway via sms-gate.app)
    sms_gate_url: str = "https://api.sms-gate.app"
    sms_gate_username: str = ""
    sms_gate_password: str = ""
    sms_gate_device_id: str = ""

    # Agmarknet
    data_gov_api_key: str = ""
    data_gov_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070"
    data_gov_resource_id_alt: str = "35985678-0d79-46b4-9ed6-6f13308a1d24"
    price_cache_ttl_hours: int = 6
    price_stale_days: int = 3

    # LLM
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    llm_model_primary: str = "qwen/qwen3-8b-27b"
    llm_model_fallback: str = "llama-3.1-70b-versatile"
    llm_model_small: str = "llama-3.1-8b-instant"
    llm_concurrency: int = 2
    llm_max_retries: int = 4
    llm_timeout_seconds: int = 45

    # Sarvam
    sarvam_api_key: str = ""
    sarvam_base_url: str = "https://api.sarvam.ai"
    sarvam_stt_model: str = "saaras:v3"
    sarvam_stt_mode: str = "transcribe"
    sarvam_tts_model: str = "bulbul:v3"
    sarvam_tts_speaker: str = "meera"
    voice_max_seconds: int = 30
    voice_stt_per_user_per_day: int = 30
    voice_tts_per_user_per_day: int = 20

    # Other upstreams
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    osrm_base_url: str = "https://router.project-osrm.org"
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = "MandiSabha/0.1 (contact: admin@mandisabha.example.com)"

    # Rate limits
    rl_general_per_min: int = 60
    rl_sabha_create_per_hour: int = 10
    rl_otp_per_phone_per_10min: int = 3
    rl_otp_per_ip_per_10min: int = 10

    # Economics (JSON strings parsed below)
    return_leg_factor: float = 2.0
    vehicle_capacity_q: str = '{"pickup":15,"truck":60,"heavy":150}'
    vehicle_default_rate_per_km: str = '{"pickup":14,"truck":28,"heavy":40}'
    loading_cost_per_q: float = 0
    commission_pct: float = 0
    toll_per_km: float = 0
    grade_multipliers: str = '{"A":1.05,"B":1.0,"C":0.92}'
    max_candidate_mandis: int = 5

    # Logging
    log_level: str = "INFO"
    log_json: bool = False

    # Parsed economics (set via model_validator)
    vehicle_capacity_q_map: dict = {}
    vehicle_default_rate_per_km_map: dict = {}
    grade_multipliers_map: dict = {}

    @model_validator(mode="after")
    def parse_json_fields(self) -> "Settings":
        self.vehicle_capacity_q_map = json.loads(self.vehicle_capacity_q)
        self.vehicle_default_rate_per_km_map = json.loads(self.vehicle_default_rate_per_km)
        self.grade_multipliers_map = json.loads(self.grade_multipliers)
        return self

    @model_validator(mode="after")
    def validate_production_safety(self) -> "Settings":
        if self.app_env == "production":
            if self.secret_key == "change-me-in-production":
                raise ValueError("SECRET_KEY must be changed from default in production")
            if self.dev_fixed_otp:
                raise ValueError("DEV_FIXED_OTP must not be set in production")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
