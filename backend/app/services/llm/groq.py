"""Groq LLM provider with retry, fallback, and model churn handling."""
from __future__ import annotations

import asyncio
import json
import re
import time
from typing import Any, Literal, Optional

import httpx
import structlog

from app.config import settings
from app.services.llm.provider import LLMProvider, LLMResponse

log = structlog.get_logger()

# Global concurrency semaphore
_llm_semaphore = asyncio.Semaphore(settings.llm_concurrency)

# Per-model capability table: what features does each model support
MODEL_CAPABILITIES: dict[str, dict] = {
    # Qwen models
    "qwen/qwen3-8b-27b": {"tool_calling": True, "json_mode": True, "reasoning": False},
    "qwen/qwen3.8-27b": {"tool_calling": True, "json_mode": True, "reasoning": False},
    # LLaMA models (fallback)
    "llama-3.1-70b-versatile": {"tool_calling": True, "json_mode": True, "reasoning": False},
    "llama-3.1-8b-instant": {"tool_calling": True, "json_mode": True, "reasoning": False},
    "llama3-70b-8192": {"tool_calling": True, "json_mode": True, "reasoning": False},
    "llama3-8b-8192": {"tool_calling": True, "json_mode": True, "reasoning": False},
    # Mixtral (common fallback)
    "mixtral-8x7b-32768": {"tool_calling": True, "json_mode": True, "reasoning": False},
}

# Available models fetched at startup
_available_model_ids: set[str] = set()


def _strip_thinking(text: str) -> str:
    """Strip <think>...</think> reasoning blocks from LLM output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _get_model_id(tier: Literal["primary", "small"]) -> str:
    if tier == "primary":
        return settings.llm_model_primary
    return settings.llm_model_small


class GroqProvider:
    """Groq API provider with retry, fallback, and model churn detection."""

    def __init__(self, client: Optional[httpx.AsyncClient] = None):
        self._client = client  # injectable for tests

    def _make_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=settings.groq_base_url,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            timeout=settings.llm_timeout_seconds,
        )

    async def chat(
        self,
        *,
        model_tier: Literal["primary", "small"],
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        tool_choice: str = "auto",
        response_format: Optional[dict] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        primary_model = _get_model_id(model_tier)
        fallback_model = settings.llm_model_fallback

        retries = 0
        last_error = None
        current_model = primary_model
        fallback_used = False

        async with _llm_semaphore:
            for attempt in range(settings.llm_max_retries + 1):
                retries = attempt
                try:
                    response = await self._do_request(
                        model=current_model,
                        messages=messages,
                        tools=tools,
                        tool_choice=tool_choice,
                        response_format=response_format,
                        max_tokens=max_tokens,
                    )
                    response.fallback_used = fallback_used
                    response.retries = retries
                    return response

                except httpx.HTTPStatusError as exc:
                    status = exc.response.status_code

                    # Model decommissioned
                    if status in (404, 400):
                        body = {}
                        try:
                            body = exc.response.json()
                        except Exception:
                            pass
                        err_msg = str(body)
                        if "model" in err_msg.lower() or "decommissioned" in err_msg.lower():
                            log.warning(
                                "model_decommissioned",
                                model=current_model,
                                switching_to=fallback_model,
                            )
                            current_model = fallback_model
                            fallback_used = True
                            continue

                    # Rate limited
                    if status == 429:
                        retry_after = float(exc.response.headers.get("retry-after", 2 ** attempt))
                        log.warning("llm_rate_limited", retry_after=retry_after, attempt=attempt)
                        await asyncio.sleep(retry_after)
                        # Try fallback on repeated 429s
                        if attempt > 1 and current_model != fallback_model:
                            current_model = fallback_model
                            fallback_used = True
                        continue

                    # Server error
                    if status >= 500:
                        delay = (2 ** attempt) * 0.5 + (time.monotonic() % 0.5)
                        await asyncio.sleep(delay)
                        if attempt > 0 and current_model != fallback_model:
                            current_model = fallback_model
                            fallback_used = True
                        last_error = exc
                        continue

                    raise

                except (httpx.TimeoutException, httpx.ConnectError) as exc:
                    delay = (2 ** attempt) * 0.5
                    log.warning("llm_timeout", attempt=attempt, delay=delay)
                    await asyncio.sleep(delay)
                    if attempt > 0 and current_model != fallback_model:
                        current_model = fallback_model
                        fallback_used = True
                    last_error = exc

        raise RuntimeError(f"LLM failed after {retries} retries: {last_error}")

    async def _do_request(
        self,
        model: str,
        messages: list[dict],
        tools: Optional[list[dict]],
        tool_choice: str,
        response_format: Optional[dict],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        body: dict[str, Any] = {"model": model, "messages": messages}

        if tools:
            body["tools"] = tools
            body["tool_choice"] = tool_choice

        if response_format:
            body["response_format"] = response_format

        if max_tokens:
            body["max_tokens"] = max_tokens

        client = self._client or self._make_client()
        use_own = self._client is None

        try:
            if use_own:
                async with client:
                    resp = await client.post("/chat/completions", json=body)
            else:
                resp = await client.post("/chat/completions", json=body)
            resp.raise_for_status()
        except Exception:
            raise

        data = resp.json()
        choice = data["choices"][0]
        msg = choice["message"]
        content = _strip_thinking(msg.get("content") or "")
        tool_calls_raw = msg.get("tool_calls") or []

        tool_calls = []
        for tc in tool_calls_raw:
            func = tc.get("function", {})
            args = func.get("arguments", "{}")
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {}
            tool_calls.append({
                "id": tc.get("id", ""),
                "name": func.get("name", ""),
                "arguments": args,
            })

        return LLMResponse(
            content=content,
            model=data.get("model", model),
            tool_calls=tool_calls,
            usage=data.get("usage", {}),
        )


async def fetch_available_models() -> set[str]:
    """Fetch available model IDs from Groq /models endpoint."""
    global _available_model_ids
    if not settings.groq_api_key:
        return set()
    try:
        async with httpx.AsyncClient(
            base_url=settings.groq_base_url,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            timeout=10,
        ) as client:
            resp = await client.get("/models")
            resp.raise_for_status()
            data = resp.json()
            ids = {m["id"] for m in data.get("data", [])}
            _available_model_ids = ids

            # Warn about configured models not in list
            for model_id in [settings.llm_model_primary, settings.llm_model_small, settings.llm_model_fallback]:
                if model_id and model_id not in ids:
                    log.warning(
                        "configured_model_not_available",
                        model=model_id,
                        note="Verify model ID via probe_apis.py and update LLM_MODEL_* in .env",
                    )
            return ids
    except Exception as exc:
        log.warning("groq_models_fetch_failed", error=str(exc))
        return set()
