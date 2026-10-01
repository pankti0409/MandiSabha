"""__init__ for llm package — exports the singleton provider."""
from __future__ import annotations

from app.services.llm.groq import GroqProvider

# Singleton provider (swap with FakeLLMProvider in tests)
llm_provider = GroqProvider()

__all__ = ["llm_provider", "GroqProvider"]
