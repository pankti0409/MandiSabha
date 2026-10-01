"""Common ToolResult envelope and base types for all tools."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel


class ToolResult(BaseModel):
    ok: bool
    data: Any = None
    source: Literal["live", "cache", "fixture", "estimate", "local"] = "live"
    data_as_of: Optional[date] = None
    fetched_at: Optional[datetime] = None
    stale: bool = False
    warnings: list[str] = []
    error: Optional[str] = None
