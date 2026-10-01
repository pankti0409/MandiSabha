"""Pure economics engine — all money math here, no LLM arithmetic.

Uses Decimal internally; rounds to whole rupees only at the presentation boundary.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal, Optional

from app.config import settings


@dataclass
class EconomicsInput:
    modal_price: float           # ₹/quintal from mandi data
    quantity_quintals: float
    distance_km: float
    vehicle_type: Literal["pickup", "truck", "heavy"] = "pickup"
    quality_grade: Optional[Literal["A", "B", "C"]] = None
    user_transport_cost_per_km: Optional[float] = None
    spoilage_pct: float = 0.0    # from Risk agent (0-100)


@dataclass
class EconomicsResult:
    # Inputs (disclosed)
    modal_price: Decimal
    price_with_grade: Decimal
    grade_multiplier: float
    quantity_quintals: Decimal
    distance_km: Decimal
    trips: int
    rate_per_km: Decimal
    rate_basis: Literal["user_setting", "vehicle_default"]
    vehicle_type: str
    vehicle_capacity_quintals: int
    return_leg_factor: float

    # Computed values
    gross_total: Decimal
    freight_total: Decimal
    tolls_total: Decimal
    loading_total: Decimal
    commission_total: Decimal
    spoilage_loss: Decimal
    net_total: Decimal
    net_per_quintal: Decimal

    # Assumptions
    warnings: list[str] = field(default_factory=list)
    transport_assumption_statement: str = ""

    # Not included items
    not_included: list[str] = field(default_factory=list)


def compute_net_value(inp: EconomicsInput) -> EconomicsResult:
    """Deterministic net value calculation. All math here, zero LLM."""
    grade_multipliers = settings.grade_multipliers_map
    capacity_map = settings.vehicle_capacity_q_map
    rate_map = settings.vehicle_default_rate_per_km_map

    # Grade multiplier
    grade_mult = 1.0
    if inp.quality_grade and inp.quality_grade in grade_multipliers:
        grade_mult = grade_multipliers[inp.quality_grade]

    modal = Decimal(str(inp.modal_price))
    price_with_grade = (modal * Decimal(str(grade_mult))).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )
    qty = Decimal(str(inp.quantity_quintals))
    dist = Decimal(str(inp.distance_km))

    # Trips
    capacity = capacity_map.get(inp.vehicle_type, 15)
    trips = math.ceil(float(qty) / capacity)

    # Rate per km
    if inp.user_transport_cost_per_km is not None:
        rate = Decimal(str(inp.user_transport_cost_per_km))
        rate_basis: Literal["user_setting", "vehicle_default"] = "user_setting"
    else:
        rate = Decimal(str(rate_map.get(inp.vehicle_type, 14)))
        rate_basis = "vehicle_default"

    rlf = Decimal(str(settings.return_leg_factor))

    gross = price_with_grade * qty
    freight = Decimal(str(trips)) * dist * rate * rlf
    tolls = dist * Decimal(str(settings.toll_per_km)) * Decimal(str(trips))
    loading = qty * Decimal(str(settings.loading_cost_per_q))
    commission = gross * Decimal(str(settings.commission_pct)) / Decimal("100")
    spoilage_loss = gross * Decimal(str(inp.spoilage_pct)) / Decimal("100")

    net = gross - freight - tolls - loading - commission - spoilage_loss
    net_per_q = net / qty if qty > 0 else Decimal("0")

    # Round to whole rupees
    def r(d: Decimal) -> Decimal:
        return d.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    warnings = []
    not_included = []
    if settings.toll_per_km == 0:
        not_included.append("tolls")
    if settings.loading_cost_per_q == 0:
        not_included.append("loading/unloading (hamali)")
    if settings.commission_pct == 0:
        not_included.append("mandi commission and market fees")
    not_included.append("waiting/parking")

    if rate_basis == "vehicle_default":
        warnings.append(
            f"Transport rate ₹{rate}/km is a placeholder default for {inp.vehicle_type}. "
            "Set your actual rate in profile for better accuracy."
        )

    grade_note = ""
    if inp.quality_grade and inp.quality_grade != "B":
        grade_note = f" adjusted by {grade_mult}× for Grade {inp.quality_grade}"

    statement = (
        f"Freight = {trips} trip(s) × {inp.distance_km:.0f} km × ₹{rate}/km × {float(rlf)} (round trip). "
        f"Tolls, loading and commission are not included."
    )

    return EconomicsResult(
        modal_price=modal,
        price_with_grade=price_with_grade,
        grade_multiplier=grade_mult,
        quantity_quintals=qty,
        distance_km=dist,
        trips=trips,
        rate_per_km=rate,
        rate_basis=rate_basis,
        vehicle_type=inp.vehicle_type,
        vehicle_capacity_quintals=capacity,
        return_leg_factor=float(rlf),
        gross_total=r(gross),
        freight_total=r(freight),
        tolls_total=r(tolls),
        loading_total=r(loading),
        commission_total=r(commission),
        spoilage_loss=r(spoilage_loss),
        net_total=r(net),
        net_per_quintal=r(net_per_q),
        warnings=warnings,
        transport_assumption_statement=statement,
        not_included=not_included,
    )


def compute_surplus_vs_local(
    winner_net: Decimal, baseline_net: Optional[Decimal], quantity: Decimal
) -> tuple[Optional[Decimal], Optional[Decimal]]:
    """Compute surplus vs local baseline. Returns (total, per_quintal) or (None, None)."""
    if baseline_net is None:
        return None, None
    surplus_total = winner_net - baseline_net
    surplus_per_q = surplus_total / quantity if quantity > 0 else Decimal("0")
    return (
        surplus_total.quantize(Decimal("1"), rounding=ROUND_HALF_UP),
        surplus_per_q.quantize(Decimal("1"), rounding=ROUND_HALF_UP),
    )


def compute_confidence(factors: list[tuple[str, int, str]]) -> dict:
    """Compute confidence score from deduction factors.
    
    Each factor: (name, deduction, note)
    """
    score = 100
    drivers = []
    for name, delta, note in factors:
        score -= delta
        drivers.append({"factor": name, "delta": -delta, "note": note})
    return {"score": max(0, score), "drivers": drivers}


def compute_arbitrage_spread_pct(winner_modal: float, baseline_modal: float) -> Optional[float]:
    """Compute price arbitrage spread as percentage."""
    if baseline_modal <= 0:
        return None
    return round((winner_modal - baseline_modal) / baseline_modal * 100, 1)
