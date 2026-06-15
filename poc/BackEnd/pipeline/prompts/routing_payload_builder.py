"""Build Phase 1 Dify payloads for Building Block routing."""

from __future__ import annotations

import copy
import json
from typing import Any


FORBIDDEN_KEYS = {"label_hint"}
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


ROUTING_SYSTEM_PROMPT = """You are AEGIS, a QA test-case governance evaluator.

Your role in this phase is ROUTING ONLY.
You must select which Building Block a given test case most likely belongs to.

You are NOT doing frame checking in this phase.
You are NOT doing currency checking in this phase.
You are NOT deciding Pass, Failed, or Skipped in this phase.

Rules:
- Base your routing decision on the test case STATED PURPOSE.
  Use: result_code from the normalized ticket, title_raw, test_case_name, description_context, labels, components.
- Do NOT route based on what the test case steps happen to contain.
  Steps are evaluated later. A test case with missing or wrong steps should still route to the correct BB for its stated domain.
- Do not invent block_id values. Only return block_id values from the provided bb_candidates_json list.
- Use project_context_text only to understand domain terminology, product vocabulary, release naming, and known synonyms.
- Use user_prompt_text only as run-specific reviewer clarification.
- Neither project_context_text nor user_prompt_text may override the provided ticket, BA, or Building Block evidence.
- Return ONLY valid JSON. No explanation outside the JSON.
"""


ROUTING_PROMPT_TEMPLATE = """You are performing Building Block routing for one test case.

PIPELINE RUN ID:
{pipeline_run_id}

TEST CASE (routing context only):
{ticket_json}

AVAILABLE BUILDING BLOCKS (compact):
{bb_candidates_json}

PROJECT CONTEXT:
{project_context_text}

ADDITIONAL REVIEWER CONTEXT:
{user_prompt_text}

TASK:
Review the test case routing context and the available Building Blocks.
Select the top 3 most appropriate Building Blocks for this test case, ranked from most to least relevant.

Base your selection on these signals in order of strength:
1. result_code field from the normalized test case (strongest signal)
2. title_raw and test_case_name (domain and scenario)
3. description_context (stated purpose)
4. labels and components (supporting signal)
5. Building Block routing_rule and description (match against above)

Confidence levels:
- high = strong match on result_code and routing_rule
- medium = plausible match but some ambiguity
- low = weak or indirect match, included as fallback only

Return ONLY valid JSON in the schema below. No text before or after.

In the JSON schema below:
- Values like "string" describe the expected value type.
- Do NOT copy placeholder values literally.
- Populate building_block_id, block_id, and title only from bb_candidates_json.
- confidence must be one of: "high", "medium", "low".
- pipeline_run_id must be the actual pipeline run id supplied above.

{{
  "top_candidates": [
    {{
      "building_block_id": "string",
      "block_id": "string",
      "title": "string",
      "confidence": "high",
      "reasoning": "string"
    }}
  ],
  "routing_summary": "string",
  "pipeline_run_id": "string"
}}
"""


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
    ticket_json = _json_for_dify(safe_ticket)
    bb_candidates_json = _json_for_dify(compact_blocks)
    prompt = ROUTING_PROMPT_TEMPLATE.format(
        pipeline_run_id=run_id,
        ticket_json=ticket_json,
        bb_candidates_json=bb_candidates_json,
        project_context_text=project_context_text.strip(),
        user_prompt_text=user_prompt_text.strip(),
    )

    return {
        "inputs": {
            "system_prompt": ROUTING_SYSTEM_PROMPT.strip(),
            "routing_prompt": prompt.strip(),
            "pipeline_run_id": run_id,
            "ticket_json": ticket_json,
            "bb_candidates_json": bb_candidates_json,
            "project_context_text": project_context_text.strip(),
            "user_prompt_text": user_prompt_text.strip(),
        },
        "response_mode": "blocking",
        "user": "aegis-poc",
    }


def build_routing_ticket_context(ticket: dict[str, Any]) -> dict[str, Any]:
    """Keep only stated-purpose fields needed for routing."""

    safe_ticket = _strip_forbidden_keys(ticket)
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

        safe_block = _strip_forbidden_keys(block)
        compact_blocks.append(
            {
                field: safe_block.get(field)
                for field in COMPACT_BB_FIELDS
                if field in safe_block
            }
        )

    return compact_blocks


def _json_for_dify(value: Any) -> str:
    return json.dumps(
        _strip_forbidden_keys(value),
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    )


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
