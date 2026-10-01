"""Crop name mapping: canonical ↔ Agmarknet commodity string ↔ aliases."""
from __future__ import annotations

# Canonical crop name → Agmarknet commodity string
CANONICAL_TO_AGMARKNET: dict[str, str] = {
    "Onion": "Onion",
    "Tomato": "Tomato",
    "Wheat": "Wheat",
    "Potato": "Potato",
    "Soybean": "Soyabean",  # Agmarknet spells it this way
    "Cotton": "Cotton",
    "Garlic": "Garlic",
    "Mustard": "Mustard",
    "Maize": "Maize",
}

AGMARKNET_TO_CANONICAL: dict[str, str] = {v: k for k, v in CANONICAL_TO_AGMARKNET.items()}
# Also map canonical -> canonical (for self-lookup)
for _crop in list(CANONICAL_TO_AGMARKNET.keys()):
    AGMARKNET_TO_CANONICAL[_crop] = _crop

# All aliases that map to a canonical crop name
ALIASES_TO_CANONICAL: dict[str, str] = {
    # English variants
    "soyabean": "Soybean",
    "soy bean": "Soybean",
    "onion": "Onion",
    "pyaaz": "Onion",
    "pyaz": "Onion",
    "tomato": "Tomato",
    "tamatar": "Tomato",
    "wheat": "Wheat",
    "gehu": "Wheat",
    "gehun": "Wheat",
    "potato": "Potato",
    "aloo": "Potato",
    "alu": "Potato",
    "soybean": "Soybean",
    "soya": "Soybean",
    "cotton": "Cotton",
    "kapas": "Cotton",
    "karpas": "Cotton",
    "garlic": "Garlic",
    "lahsun": "Garlic",
    "lasun": "Garlic",
    "mustard": "Mustard",
    "sarson": "Mustard",
    "raida": "Mustard",
    "rayda": "Mustard",
    "maize": "Maize",
    "makka": "Maize",
    "makkai": "Maize",
    "corn": "Maize",
    # Hindi (Devanagari)
    "प्याज": "Onion",
    "प्याज़": "Onion",
    "टमाटर": "Tomato",
    "गेहूं": "Wheat",
    "गेहूँ": "Wheat",
    "आलू": "Potato",
    "सोयाबीन": "Soybean",
    "कपास": "Cotton",
    "लहसुन": "Garlic",
    "सरसों": "Mustard",
    "मक्का": "Maize",
    # Gujarati
    "કાંદા": "Onion",
    "ટામેટા": "Tomato",
    "ઘઉં": "Wheat",
    "બટાકા": "Potato",
    "સોયાબીન": "Soybean",
    "કપાસ": "Cotton",
    "લસણ": "Garlic",
    "રાયડો": "Mustard",
    "મકાઈ": "Maize",
}

SUPPORTED_CROPS = set(CANONICAL_TO_AGMARKNET.keys())


def to_canonical(name: str) -> str | None:
    """Resolve any crop alias to canonical name. Returns None if not found."""
    stripped = name.strip()
    if stripped in SUPPORTED_CROPS:
        return stripped
    lower = stripped.lower()
    return ALIASES_TO_CANONICAL.get(lower) or ALIASES_TO_CANONICAL.get(stripped)


def to_agmarknet(canonical: str) -> str:
    """Convert canonical crop name to Agmarknet commodity string."""
    return CANONICAL_TO_AGMARKNET.get(canonical, canonical)
