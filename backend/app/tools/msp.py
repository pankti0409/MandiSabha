"""MSP (Minimum Support Price) tool — reads from data/msp.json.

All MSP values must be filled from official PIB/CACP notifications.
The tool never invents values from model memory.
"""
from __future__ import annotations

import json
import os
from typing import Optional

from app.tools.registry import ToolResult

MSP_FILE = "data/msp.json"

# Crops with no MSP
NO_MSP_CROPS = {"Onion", "Tomato", "Potato", "Garlic"}


async def get_msp(crop: str) -> ToolResult:
    """Return MSP data for the crop. Returns null for crops with no MSP."""
    if crop in NO_MSP_CROPS:
        return ToolResult(
            ok=True,
            data={"crop": crop, "mspPerQuintal": None, "note": f"{crop} has no MSP (perishable/non-notified)"},
            source="local",
        )

    if not os.path.exists(MSP_FILE):
        return ToolResult(ok=False, error="MSP file not found. Run scripts/seed.py first.")

    with open(MSP_FILE) as f:
        msp_data = json.load(f)

    crop_data = msp_data.get(crop)
    if not crop_data:
        return ToolResult(
            ok=True,
            data={"crop": crop, "mspPerQuintal": None, "note": "MSP data not available for this crop"},
            source="local",
        )

    # Validate that the value is set (not a TODO placeholder)
    if crop_data.get("mspPerQuintal") is None:
        return ToolResult(
            ok=True,
            data={
                "crop": crop,
                "mspPerQuintal": None,
                "note": "MSP value not yet filled from official source. Check data/msp.json.",
                "sourceUrl": crop_data.get("sourceUrl"),
            },
            source="local",
            warnings=["MSP file has placeholder — fill from official PIB/CACP notification"],
        )

    return ToolResult(ok=True, data={**crop_data, "crop": crop}, source="local")
