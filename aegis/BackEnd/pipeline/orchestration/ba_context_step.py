"""BA context selection for one ticket."""

from __future__ import annotations

from typing import Any

from pipeline.payloads.payload_utils import build_ba_context_for_ticket


def build_ticket_ba_context(
    *,
    normalized_ba: dict[str, Any],
    ticket: dict[str, Any],
) -> dict[str, Any]:
    return build_ba_context_for_ticket(
        normalized_ba=normalized_ba,
        result_code=ticket.get("result_code"),
    )
