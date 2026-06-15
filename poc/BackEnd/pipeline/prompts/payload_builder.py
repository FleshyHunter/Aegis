"""Build Dify request payloads from normalized pipeline objects."""

from __future__ import annotations

import copy
from typing import Any

from .evaluation_prompt import get_evaluation_prompt
from .system_prompt import get_system_prompt


FORBIDDEN_KEYS = {"label_hint"}


def build_dify_payload(
    *,
    ticket: dict[str, Any],
    ba_context: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    project_context_text: str = "",
    user_prompt_text: str = "",
    pipeline_run_id: str | None = None,
) -> dict[str, Any]:
    """Build one Dify Workflow request body for one normalized ticket."""

    safe_ticket = _strip_forbidden_keys(ticket)
    safe_ba_context = _strip_forbidden_keys(ba_context)
    safe_building_blocks = _strip_forbidden_keys(building_blocks)

    return {
        "inputs": {
            "system_prompt": get_system_prompt(),
            "evaluation_prompt": get_evaluation_prompt(),
            "pipeline_run_id": pipeline_run_id or "",
            "project_context_text": project_context_text.strip(),
            "user_prompt_text": user_prompt_text.strip(),
            "ticket": safe_ticket,
            "ba": safe_ba_context,
            "building_blocks": safe_building_blocks,
        },
        "response_mode": "blocking",
        "user": "aegis-poc",
    }


def build_ba_context_for_ticket(
    *,
    normalized_ba: dict[str, Any],
    result_code: str | None,
) -> dict[str, Any]:
    """Select latest and historical BA rows for one ticket result code."""

    if not result_code:
        return {
            "result_code": None,
            "latest_rule": None,
            "historical_rules": [],
            "mapping_status": "not_found",
        }

    normalized_code = result_code.strip().upper()
    rules = normalized_ba.get("rules_by_result_code", {}).get(normalized_code, [])
    latest_rule = normalized_ba.get("latest_by_result_code", {}).get(normalized_code)

    return {
        "result_code": normalized_code,
        "latest_rule": latest_rule,
        "historical_rules": rules,
        "mapping_status": "found" if latest_rule else "not_found",
    }


def build_dify_payloads_for_tickets(
    *,
    normalized_tickets: dict[str, Any],
    normalized_ba: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    project_context_text: str = "",
    user_prompt_text: str = "",
    pipeline_run_id: str | None = None,
) -> list[dict[str, Any]]:
    """Build one Dify payload per normalized ticket."""

    tickets = normalized_tickets.get("tickets", [])
    if not isinstance(tickets, list):
        raise ValueError("normalized_tickets must contain a tickets list")

    return [
        build_dify_payload(
            ticket=ticket,
            ba_context=build_ba_context_for_ticket(
                normalized_ba=normalized_ba,
                result_code=ticket.get("result_code"),
            ),
            building_blocks=building_blocks,
            project_context_text=project_context_text,
            user_prompt_text=user_prompt_text,
            pipeline_run_id=pipeline_run_id,
        )
        for ticket in tickets
        if isinstance(ticket, dict)
    ]


def _strip_forbidden_keys(value: Any) -> Any:
    copied = copy.deepcopy(value)
    return _remove_keys(copied, FORBIDDEN_KEYS)


def _remove_keys(value: Any, forbidden_keys: set[str]) -> Any:
    if isinstance(value, dict):
        return {
            key: _remove_keys(item, forbidden_keys)
            for key, item in value.items()
            if key not in forbidden_keys
        }

    if isinstance(value, list):
        return [_remove_keys(item, forbidden_keys) for item in value]

    return value
