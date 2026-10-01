"""LLM provider protocol and response type."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional, Protocol, runtime_checkable


@dataclass
class LLMResponse:
    content: str
    model: str
    tool_calls: list[dict] = field(default_factory=list)
    usage: dict = field(default_factory=dict)
    fallback_used: bool = False
    retries: int = 0


@runtime_checkable
class LLMProvider(Protocol):
    async def chat(
        self,
        *,
        model_tier: Literal["primary", "small"],
        messages: list[dict],
        tools: Optional[list[dict]] = None,
        tool_choice: str = "auto",
        response_format: Optional[dict] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse: ...
