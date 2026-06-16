"""Build Phase 2 Dify payloads for full frame/currency evaluation."""

from __future__ import annotations

from typing import Any

from .payload_utils import build_dify_envelope, json_for_dify, strip_forbidden_keys


EVALUATION_SYSTEM_PROMPT = """You are AEGIS, a QA test-case governance evaluator.

Your role in this phase is FULL EVALUATION on two independent axes:

Axis 1 - Frame Conformance
Source of truth: the provided Building Block canonical test_steps.
Question: Does the test case contain all required canonical steps?

Axis 2 - Requirement Currency
Source of truth: the provided BA rule for the test case result_code.
Question: Does the test case reflect the latest BA requirement?

Rules for Building Block confirmation:
- First confirm whether the provided Building Block is the correct match.
- If the BB is clearly wrong for this test case domain, set building_block_confirmed to false. Do not evaluate frame or currency.
- If confirmed, proceed with both axes.
- If building_block_confirmed is true, frame_passed and currency_passed must both be booleans. They may NOT be null.
- If building_block_confirmed is false, frame_passed and currency_passed must both be null.

Rules for Frame Conformance:
- The test case must contain ALL canonical Building Block steps.
- Extra test case steps are allowed.
- Matching is SEMANTIC. Do not require exact wording.
- If a canonical step is clearly present even with different wording, it counts as present.
- If a canonical step is absent or directly contradicted, frame fails.
- Missing any required canonical step is a frame failure.
- Contradicting a canonical step is a frame failure.

Rules for Requirement Currency:
- Compare the test case steps and expected results against the latest BA rule.
- Focus on BA fields that define current expected behaviour, including action labels, status/display values, automation flags, notification requirements, permission flags, validity, and deprecated/obsolete status.
- Steps and expected results are stronger evidence than title wording.
- Do not fail currency on title wording alone.
- If ba_context.mapping_status is not_found or latest_rule is null, currency_passed must be false. A missing or unmappable Result Code is a currency failure, not a Skipped case.

Project context rules:
- project_context_text may describe the domain, product vocabulary, release naming, and known synonyms.
- project_context_text can help interpret ambiguous terminology.
- project_context_text CANNOT override BA or Building Block truth.

User prompt rules:
- Reviewer context may clarify run-specific synonyms or naming oddities.
- It can help interpret ambiguous evidence.
- It CANNOT override BA or BB truth.

Do NOT decide the final Pass/Failed/Skipped classification.
That is determined by the backend deterministically.
Return frame_passed and currency_passed accurately with evidence.

Return ONLY valid JSON. No explanation outside the JSON.
"""


EVALUATION_PROMPT_TEMPLATE = """You are performing full frame and currency evaluation for one test case.

PIPELINE RUN ID:
{pipeline_run_id}

TEST CASE (full):
{ticket_json}

LATEST BA RULE FOR THIS RESULT CODE:
{ba_context_json}

SELECTED BUILDING BLOCK (full, including canonical steps):
{building_block_json}

PROJECT CONTEXT:
{project_context_text}

ADDITIONAL REVIEWER CONTEXT:
{user_prompt_text}

TASK:
1. Confirm whether the selected Building Block is the correct match for this test case based on its result_code and stated domain.
2. If confirmed, evaluate Frame Conformance against the Building Block canonical test_steps.
3. If confirmed, evaluate Requirement Currency against the latest BA rule. If ba_context.mapping_status is not_found or latest_rule is null, set currency_passed to false immediately.
4. Return your findings in the exact JSON structure below.

Return ONLY valid JSON in the schema below. No text before or after.

In the JSON schema below:
- Values like "string", true, false, null, and [] describe the expected value type or allowed JSON shape.
- Do NOT copy placeholder values literally.
- Populate building_block_id and block_id only from the selected building_block_json.
- pipeline_run_id must be the actual pipeline run id supplied above.
- When building_block_confirmed is true, frame_passed and currency_passed must be booleans.
- When building_block_confirmed is false, frame_passed and currency_passed must be null.

When building_block_confirmed is true:

{{
  "building_block_confirmed": true,
  "building_block_id": "string",
  "block_id": "string",
  "building_block_confirmation_reasoning": "string",
  "frame_passed": false,
  "frame_reasoning": "string",
  "missing_canonical_steps": [
    "string"
  ],
  "currency_passed": true,
  "currency_reasoning": "string",
  "stale_evidence": [
    "string"
  ],
  "pipeline_run_id": "string"
}}

When building_block_confirmed is false:

{{
  "building_block_confirmed": false,
  "building_block_id": "string",
  "block_id": "string",
  "building_block_confirmation_reasoning": "string",
  "frame_passed": null,
  "frame_reasoning": null,
  "missing_canonical_steps": [],
  "currency_passed": null,
  "currency_reasoning": null,
  "stale_evidence": [],
  "pipeline_run_id": "string"
}}
"""


def build_evaluation_payload(
    *,
    ticket: dict[str, Any],
    ba_context: dict[str, Any],
    building_block: dict[str, Any],
    project_context_text: str = "",
    user_prompt_text: str = "",
    pipeline_run_id: str | None = None,
) -> dict[str, Any]:
    """Build a string-input Dify payload for Phase 2 evaluation."""

    run_id = pipeline_run_id or ""
    safe_ticket = strip_forbidden_keys(ticket)
    safe_ba_context = strip_forbidden_keys(ba_context)
    safe_building_block = strip_forbidden_keys(building_block)
    ticket_json = json_for_dify(safe_ticket)
    ba_context_json = json_for_dify(safe_ba_context)
    building_block_json = json_for_dify(safe_building_block)
    prompt = EVALUATION_PROMPT_TEMPLATE.format(
        pipeline_run_id=run_id,
        ticket_json=ticket_json,
        ba_context_json=ba_context_json,
        building_block_json=building_block_json,
        project_context_text=project_context_text.strip(),
        user_prompt_text=user_prompt_text.strip(),
    )

    return build_dify_envelope(
        inputs={
            "system_prompt": EVALUATION_SYSTEM_PROMPT.strip(),
            "evaluation_prompt": prompt.strip(),
            "pipeline_run_id": run_id,
            "ticket_json": ticket_json,
            "ba_context_json": ba_context_json,
            "building_block_json": building_block_json,
            "project_context_text": project_context_text.strip(),
            "user_prompt_text": user_prompt_text.strip(),
        }
    )
