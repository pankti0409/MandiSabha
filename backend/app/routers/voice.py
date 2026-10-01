"""Voice router — STT, TTS, parse, spoken summary."""
from __future__ import annotations

import base64
import hashlib
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.config import settings
from app.db import get_db
from app.models import User
from app.schemas import ParseVoiceResponse, SpeakRequest, TranscribeResponse

router = APIRouter(prefix="/voice", tags=["voice"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _check_usage_cap(user_id: str, usage_type: str, db: AsyncSession) -> None:
    """Check and increment daily voice usage. Raises 429 if over cap."""
    from sqlalchemy import select
    from app.models import VoiceUsage

    today = date.today()
    result = await db.execute(
        select(VoiceUsage).where(VoiceUsage.user_id == user_id, VoiceUsage.day == today)
    )
    usage = result.scalar_one_or_none()

    cap = settings.voice_stt_per_user_per_day if usage_type == "stt" else settings.voice_tts_per_user_per_day
    count = getattr(usage, f"{usage_type}_count", 0) if usage else 0

    if count >= cap:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "voice_cap_exceeded", "message": f"Daily {usage_type.upper()} limit reached ({cap}/day)"},
        )

    if not usage:
        usage = VoiceUsage(user_id=user_id, day=today, stt_count=0, tts_count=0)
        db.add(usage)

    setattr(usage, f"{usage_type}_count", count + 1)
    await db.commit()


async def _sarvam_stt(audio_bytes: bytes, language_code: Optional[str] = None) -> dict:
    """Call Sarvam STT API."""
    if not settings.sarvam_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "voice_unavailable", "message": "Voice service not configured"},
        )

    import httpx
    headers = {"api-subscription-key": settings.sarvam_api_key}
    files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
    data: dict = {"model": settings.sarvam_stt_model, "mode": settings.sarvam_stt_mode}
    if language_code:
        data["language_code"] = language_code

    async with httpx.AsyncClient(base_url=settings.sarvam_base_url, headers=headers, timeout=30) as client:
        resp = await client.post("/speech-to-text", files=files, data=data)
        resp.raise_for_status()
        return resp.json()


async def _sarvam_tts(text: str, language_code: str) -> bytes:
    """Call Sarvam TTS API. Chunks long text."""
    if not settings.sarvam_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "voice_unavailable", "message": "Voice service not configured"},
        )

    import httpx

    # Split into chunks of ~500 chars on sentence boundaries
    def _split(t: str, max_len: int = 400) -> list[str]:
        import re
        sentences = re.split(r"(?<=[.।!?])\s+", t)
        chunks, current = [], ""
        for s in sentences:
            if len(current) + len(s) > max_len and current:
                chunks.append(current.strip())
                current = s
            else:
                current += " " + s
        if current.strip():
            chunks.append(current.strip())
        return chunks or [t]

    chunks = _split(text)
    all_audio = b""

    headers = {"api-subscription-key": settings.sarvam_api_key, "Content-Type": "application/json"}
    async with httpx.AsyncClient(base_url=settings.sarvam_base_url, headers=headers, timeout=30) as client:
        for chunk in chunks:
            payload = {
                "text": chunk,
                "target_language_code": language_code,
                "speaker": settings.sarvam_tts_speaker,
                "model": settings.sarvam_tts_model,
            }
            resp = await client.post("/text-to-speech", json=payload)
            resp.raise_for_status()
            data = resp.json()
            # Response may be JSON with base64 audio or raw bytes
            if isinstance(data, dict):
                audio_b64 = data.get("audios", [data.get("audio", "")])[0]
                all_audio += base64.b64decode(audio_b64)
            else:
                all_audio += resp.content

    return all_audio


def _lang_to_code(lang: str) -> str:
    mapping = {"hi": "hi-IN", "gu": "gu-IN", "en": "en-IN"}
    return mapping.get(lang, "en-IN")


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Audio → transcript only."""
    await _check_usage_cap(current_user.id, "stt", db)

    audio_bytes = await audio.read()
    if len(audio_bytes) > settings.voice_max_seconds * 16000 * 2:  # rough size cap
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "audio_too_long", "message": f"Audio must be ≤{settings.voice_max_seconds} seconds"},
        )

    lang_code = _lang_to_code(language or getattr(current_user, "language", "en") or "en")
    stt_result = await _sarvam_stt(audio_bytes, lang_code)

    transcript = stt_result.get("transcript", "")
    detected_lang = stt_result.get("language_code", lang_code).split("-")[0]

    return TranscribeResponse(transcript=transcript, detected_language=detected_lang)


@router.post("/parse", response_model=ParseVoiceResponse)
async def parse_voice(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Audio → transcript → parsed sabha draft fields."""
    await _check_usage_cap(current_user.id, "stt", db)

    audio_bytes = await audio.read()
    if len(audio_bytes) > settings.voice_max_seconds * 32000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "audio_too_long", "message": f"Audio must be ≤{settings.voice_max_seconds} seconds"},
        )

    lang_code = _lang_to_code(language or getattr(current_user, "language", "en") or "en")
    stt_result = await _sarvam_stt(audio_bytes, lang_code)
    transcript = stt_result.get("transcript", "")
    detected_lang = stt_result.get("language_code", lang_code).split("-")[0]

    # Parse with Intake agent logic (simplified call)
    from app.services.llm import llm_provider
    from app.agents.prompts import INTAKE_SYSTEM
    from datetime import date as ddate

    profile_summary = f"village={current_user.village}, district={current_user.district}, crops={current_user.crops}"
    system_prompt = INTAKE_SYSTEM.format(
        language=detected_lang,
        today=str(ddate.today()),
        profile_summary=profile_summary,
    )

    try:
        response = await llm_provider.chat(
            model_tier="primary",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f'Transcript: "{transcript}"'},
            ],
            max_tokens=600,
        )
        import json, re
        content = response.content
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
        else:
            parsed = {}
    except Exception:
        parsed = {}

    assumed = parsed.get("assumedFromProfile", [])
    if not parsed.get("locationText") and current_user.village:
        assumed = assumed + ["location"]

    draft = {
        "crop": parsed.get("crop"),
        "quantity": parsed.get("quantityQuintals"),
        "location": parsed.get("locationText") or f"{current_user.village}, {current_user.district or ''}",
        "urgency": parsed.get("urgency"),
        "targetDate": parsed.get("targetDate"),
        "targetMandi": parsed.get("targetMandi"),
    }

    return ParseVoiceResponse(
        transcript=transcript,
        detected_language=detected_lang,
        draft=draft,
        field_confidence=parsed.get("fieldConfidence", {}),
        assumed_from_profile=assumed,
        missing=parsed.get("missing", []),
    )


@router.post("/speak")
async def speak(
    body: SpeakRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Text → audio. Cached by hash."""
    from app.models import TtsCache

    lang_code = _lang_to_code(body.language or getattr(current_user, "language", "en") or "en")
    cache_key = hashlib.sha256(
        f"{body.text}:{lang_code}:{settings.sarvam_tts_speaker}:{settings.sarvam_tts_model}".encode()
    ).hexdigest()

    # Check TTS cache
    cached = await db.get(TtsCache, cache_key)
    if cached:
        audio_bytes = base64.b64decode(cached.audio_b64)
        return Response(content=audio_bytes, media_type="audio/wav")

    await _check_usage_cap(current_user.id, "tts", db)
    audio_bytes = await _sarvam_tts(body.text, lang_code)

    # Cache
    cache_entry = TtsCache(cache_hash=cache_key, audio_b64=base64.b64encode(audio_bytes).decode())
    db.add(cache_entry)
    await db.commit()

    return Response(content=audio_bytes, media_type="audio/wav")


@router.get("/{sabha_id}/speech")
async def get_speech_summary(
    sabha_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Spoken summary of recommendation."""
    from sqlalchemy import select
    from app.models import Sabha, TtsCache

    result = await db.execute(
        select(Sabha).where(Sabha.id == sabha_id, Sabha.user_id == current_user.id)
    )
    sabha = result.scalar_one_or_none()
    if not sabha or not sabha.recommendation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "not_found"})

    rec = sabha.recommendation
    winner = rec.get("winner", {})
    lang = getattr(current_user, "language", "en") or "en"

    summary_text = (
        f"Mandi Sabha recommendation for {rec.get('crop', '')}: "
        f"Sell {rec.get('quantityQuintals', '')} quintals at {winner.get('name', '')} "
        f"at ₹{winner.get('modalPrice', 0):.0f} per quintal. "
        f"Net payout: ₹{winner.get('netTotal', 0):.0f}. "
        f"Prices as of {rec.get('dataAsOf', 'recent date')}."
    )

    lang_code = _lang_to_code(lang)
    cache_key = hashlib.sha256(f"{summary_text}:{lang_code}".encode()).hexdigest()

    cached = await db.get(TtsCache, cache_key)
    if cached:
        audio_bytes = base64.b64decode(cached.audio_b64)
        return Response(content=audio_bytes, media_type="audio/wav")

    await _check_usage_cap(current_user.id, "tts", db)
    audio_bytes = await _sarvam_tts(summary_text, lang_code)

    cache_entry = TtsCache(cache_hash=cache_key, audio_b64=base64.b64encode(audio_bytes).decode())
    db.add(cache_entry)
    await db.commit()

    return Response(content=audio_bytes, media_type="audio/wav")
