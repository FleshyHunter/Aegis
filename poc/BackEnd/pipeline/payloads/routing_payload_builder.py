"""Build Phase 1 Dify payloads for Building Block routing."""

from __future__ import annotations

from typing import Any

from ..prompts.routing_prompt import get_routing_system_prompt, render_routing_prompt
from .payload_utils import build_dify_envelope, json_for_dify, strip_forbidden_keys

ROUTING_TICKET_FIELDS = [
    "derived_test_case_id",
    "jira_ticket_id",
    "test_case_id",
    "result_code",
    "result_code_source",
    "title_raw",
    "test_case_name",
    "description_context",
    "labels",
    "components",
    "fix_versions",
    "title_convention_status",
    "title_parse_warnings",
]
COMPACT_BB_FIELDS = [
    "building_block_id",
    "block_id",
    "title",
    "version",
    "routing_rule",
    "description",
]


def build_routing_payload(
    *,
    ticket: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    project_context_text: str = "",
    user_prompt_text: str = "",
    pipeline_run_id: str | None = None,
) -> dict[str, Any]:
    """Build a string-input Dify payload for Phase 1 routing."""

    run_id = pipeline_run_id or ""
    safe_ticket = build_routing_ticket_context(ticket)
    compact_blocks = build_compact_building_blocks(building_blocks)
    ticket_json = json_for_dify(safe_ticket)
    bb_candidates_json = json_for_dify(compact_blocks)
    prompt = render_routing_prompt(
        pipeline_run_id=run_id,
        ticket_json=ticket_json,
        bb_candidates_json=bb_candidates_json,
        project_context_text=project_context_text.strip(),
        user_prompt_text=user_prompt_text.strip(),
    )

    return build_dify_envelope(
        inputs={
            "system_prompt": get_routing_system_prompt(),
            "routing_prompt": prompt,
            "pipeline_run_id": run_id,
            "ticket_json": ticket_json,
            "bb_candidates_json": bb_candidates_json,
            "project_context_text": project_context_text.strip(),
            "user_prompt_text": user_prompt_text.strip(),
        }
    )


def build_routing_ticket_context(ticket: dict[str, Any]) -> dict[str, Any]:
    """Keep only stated-purpose fields needed for routing."""

    safe_ticket = strip_forbidden_keys(ticket)
    return {
        field: safe_ticket.get(field)
        for field in ROUTING_TICKET_FIELDS
        if field in safe_ticket
    }


def build_compact_building_blocks(
    building_blocks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Compact BBs for routing by excluding canonical frame details."""

    compact_blocks: list[dict[str, Any]] = []
    for block in building_blocks:
        if not isinstance(block, dict):
            continue

        safe_block = strip_forbidden_keys(block)
        compact_blocks.append(
            {
                field: safe_block.get(field)
                for field in COMPACT_BB_FIELDS
                if field in safe_block
            }
        )

    return compact_blocks
