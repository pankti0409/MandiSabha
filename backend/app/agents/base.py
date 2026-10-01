"""Base agent class with plain tool-calling loop."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Literal, Optional, Type

import structlog

from app.services.llm.provider import LLMProvider, LLMResponse

log = structlog.get_logger()

MAX_TOOL_STEPS = 6


class AgentError(Exception):
    recoverable: bool = True


class BaseAgent:
    name: str
    display_name: str
    role: str
    system_prompt_template: str
    allowed_tools: list[str]
    model_tier: Literal["primary", "small"]

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    def _get_system_prompt(self, **kwargs) -> str:
        return self.system_prompt_template.format(**kwargs)

    async def run(
        self,
        user_message: str,
        system_kwargs: dict,
        available_tools: dict[str, Any],  # name -> async callable
        tool_schemas: list[dict],  # JSON schemas for LLM
        max_tokens: Optional[int] = None,
    ) -> tuple[dict, list[dict]]:
        """Run the tool-calling loop. Returns (parsed_output, tool_call_log)."""
        system_prompt = self._get_system_prompt(**system_kwargs)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        # Filter schemas to allowed tools only
        filtered_schemas = [
            s for s in tool_schemas
            if s.get("function", {}).get("name") in self.allowed_tools
        ]

        tool_call_log = []
        steps = 0

        while steps < MAX_TOOL_STEPS:
            steps += 1
            response: LLMResponse = await self.provider.chat(
                model_tier=self.model_tier,
                messages=messages,
                tools=filtered_schemas if filtered_schemas else None,
                max_tokens=max_tokens,
            )

            if not response.tool_calls:
                # Final answer
                content = response.content.strip()
                # Try to parse JSON
                parsed = self._extract_json(content)
                if parsed is not None:
                    return parsed, tool_call_log

                # One repair attempt
                messages.append({"role": "assistant", "content": content})
                messages.append({
                    "role": "user",
                    "content": "Your response must be valid JSON only. Respond with the JSON object only, no prose.",
                })
                response2 = await self.provider.chat(
                    model_tier=self.model_tier,
                    messages=messages,
                    max_tokens=max_tokens,
                )
                parsed2 = self._extract_json(response2.content)
                if parsed2 is not None:
                    return parsed2, tool_call_log

                raise AgentError(f"Agent {self.name} produced invalid JSON after repair attempt")

            # Process tool calls
            tool_results_messages = []
            calls = []

            for tc in response.tool_calls:
                tool_name = tc["name"]

                # Enforce allow-list
                if tool_name not in self.allowed_tools:
                    log.warning("tool_call_rejected", agent=self.name, tool=tool_name)
                    calls.append({
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"error": f"Tool '{tool_name}' is not allowed for this agent"}),
                    })
                    continue

                if tool_name not in available_tools:
                    calls.append({
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"error": f"Tool '{tool_name}' not available"}),
                    })
                    continue

                # Execute tool with timeout
                start = datetime.now(timezone.utc).timestamp()
                try:
                    tool_fn = available_tools[tool_name]
                    args = tc.get("arguments", {})
                    result = await asyncio.wait_for(
                        tool_fn(**args) if callable(tool_fn) else asyncio.coroutine(tool_fn)(**args),
                        timeout=12.0,
                    )
                    result_dict = result.model_dump() if hasattr(result, "model_dump") else dict(result)
                    duration_ms = int((datetime.now(timezone.utc).timestamp() - start) * 1000)

                    tool_call_log.append({
                        "tool": tool_name,
                        "args": args,
                        "ok": result_dict.get("ok", True),
                        "source": result_dict.get("source"),
                        "durationMs": duration_ms,
                        "id": tc["id"],
                    })

                    calls.append({
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result_dict),
                    })

                except asyncio.TimeoutError:
                    calls.append({
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"ok": False, "error": "Tool timed out"}),
                    })
                except Exception as exc:
                    log.warning("tool_call_error", tool=tool_name, error=str(exc))
                    calls.append({
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"ok": False, "error": str(exc)}),
                    })

            # Append assistant message with tool calls
            messages.append({
                "role": "assistant",
                "content": response.content,
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc.get("arguments", {}))},
                    }
                    for tc in response.tool_calls
                ],
            })

            # Append tool results
            for call in calls:
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["tool_call_id"],
                    "content": call["content"],
                })

        raise AgentError(f"Agent {self.name} exceeded maximum tool steps ({MAX_TOOL_STEPS})")

    def _extract_json(self, text: str) -> Optional[dict]:
        """Try to extract JSON from text (may have markdown fences)."""
        text = text.strip()
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Try stripping markdown fences
        import re
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        # Try finding first JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        return None
