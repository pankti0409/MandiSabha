"""Net value tool — wraps the economics service for agent tool calls."""
from __future__ import annotations

from typing import Literal, Optional

from app.services.economics import EconomicsInput, compute_net_value
from app.tools.registry import ToolResult


async def compute_net_value_tool(
    modal_price: float,
    quantity_quintals: float,
    distance_km: float,
    vehicle_type: Literal["pickup", "truck", "heavy"] = "pickup",
    quality_grade: Optional[Literal["A", "B", "C"]] = None,
    user_transport_cost_per_km: Optional[float] = None,
    spoilage_pct: float = 0.0,
) -> ToolResult:
    """Call the economics engine and return structured results."""
    inp = EconomicsInput(
        modal_price=modal_price,
        quantity_quintals=quantity_quintals,
        distance_km=distance_km,
        vehicle_type=vehicle_type,
        quality_grade=quality_grade,
        user_transport_cost_per_km=user_transport_cost_per_km,
        spoilage_pct=spoilage_pct,
    )
    result = compute_net_value(inp)

    return ToolResult(
        ok=True,
        data={
            "modalPrice": float(result.modal_price),
            "priceWithGrade": float(result.price_with_grade),
            "gradeMultiplier": result.grade_multiplier,
            "quantityQuintals": float(result.quantity_quintals),
            "distanceKm": float(result.distance_km),
            "trips": result.trips,
            "ratePerKm": float(result.rate_per_km),
            "rateBasis": result.rate_basis,
            "vehicleType": result.vehicle_type,
            "vehicleCapacityQuintals": result.vehicle_capacity_quintals,
            "returnLegFactor": result.return_leg_factor,
            "grossTotal": float(result.gross_total),
            "freightTotal": float(result.freight_total),
            "tollsTotal": float(result.tolls_total),
            "loadingTotal": float(result.loading_total),
            "commissionTotal": float(result.commission_total),
            "spoilageLoss": float(result.spoilage_loss),
            "netTotal": float(result.net_total),
            "netPerQuintal": float(result.net_per_quintal),
            "transportAssumptionStatement": result.transport_assumption_statement,
            "notIncluded": result.not_included,
        },
        source="local",
        warnings=result.warnings,
    )
