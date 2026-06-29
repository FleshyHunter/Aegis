"""Debug logging helpers for AI response validation failures."""

from __future__ import annotations

import json
import sys
from typing import Any


def log_ai_validation_failure(
    *,
    phase: str,
    outputs: dict[str, Any],
    extracted: Any,
    ticket: dict[str, Any],
    building_block: dict[str, Any],
) -> None:
    ticket_label = ticket_debug_label(ticket)
    print(
        f"[pipeline debug] [{ticket_label}] {phase} response validation failed.",
        file=sys.stderr,
    )
    print(
        f"[pipeline debug] [{ticket_label}] Ticket:",
        debug_json(
            {
                "derived_test_case_id": ticket.get("derived_test_case_id"),
                "jira_ticket_id": ticket.get("jira_ticket_id"),
                "test_case_id": ticket.get("test_case_id"),
                "result_code": ticket.get("result_code"),
            }
        ),
        file=sys.stderr,
    )
    print(
        f"[pipeline debug] [{ticket_label}] BuildingBlock:",
        debug_json(compact_debug_building_block(building_block)),
        file=sys.stderr,
    )
    print(
        f"[pipeline debug] [{ticket_label}] Raw Dify outputs:",
        debug_json(outputs),
        file=sys.stderr,
    )
    print(
        f"[pipeline debug] [{ticket_label}] Extracted Dify result:",
        debug_json(extracted),
        file=sys.stderr,
    )


def ticket_debug_label(ticket: dict[str, Any]) -> str:
    return " / ".join(
        str(value)
        for value in [
            ticket.get("jira_ticket_id"),
            ticket.get("test_case_id"),
            ticket.get("derived_test_case_id"),
        ]
        if value
    ) or "unknown ticket"


def compact_debug_building_block(building_block: dict[str, Any]) -> dict[str, Any] | str:
    if not building_block:
        return "not selected yet"

    return {
        "building_block_id": building_block.get("building_block_id"),
        "block_id": building_block.get("block_id"),
        "title": building_block.get("title"),
    }


def debug_json(value: Any, *, limit: int = 6000) -> str:
    try:
        text = json.dumps(value, ensure_ascii=True, sort_keys=True, default=str)
    except TypeError:
        text = repr(value)

    if len(text) <= limit:
        return text

    return f"{text[:limit]}... [truncated {len(text) - limit} chars]"
