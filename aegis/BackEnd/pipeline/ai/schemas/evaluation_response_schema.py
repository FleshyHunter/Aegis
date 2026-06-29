"""Response contract for Phase 2 frame/currency evaluation."""

from __future__ import annotations

from typing import Any, TypedDict

from pipeline.ai.schemas.common import (
    PipelineResponseValidationError,
    optional_bool,
    optional_string,
    required_bool,
    required_string,
    string_list,
)


class EvaluationResponse(TypedDict):
    building_block_confirmed: bool
    building_block_id: str
    block_id: str
    building_block_confirmation_reasoning: str
    frame_passed: bool | None
    frame_reasoning: str | None
    missing_canonical_steps: list[str]
    currency_passed: bool | None
    currency_reasoning: str | None
    stale_evidence: list[str]
    pipeline_run_id: str


def validate_evaluation_response(value: Any) -> EvaluationResponse:
    if not isinstance(value, dict):
        raise PipelineResponseValidationError("Evaluation response must be an object.")

    confirmed = required_bool(value, "building_block_confirmed")
    frame_passed = optional_bool(value, "frame_passed")
    currency_passed = optional_bool(value, "currency_passed")

    if confirmed and frame_passed is None:
        raise PipelineResponseValidationError(
            "Confirmed evaluation responses must include boolean frame_passed."
        )

    if not confirmed and (frame_passed is not None or currency_passed is not None):
        raise PipelineResponseValidationError(
            "Unconfirmed evaluation responses must use null frame_passed and currency_passed."
        )

    return {
        "building_block_confirmed": confirmed,
        "building_block_id": required_string(value, "building_block_id"),
        "block_id": required_string(value, "block_id"),
        "building_block_confirmation_reasoning": required_string(
            value,
            "building_block_confirmation_reasoning",
        ),
        "frame_passed": frame_passed,
        "frame_reasoning": optional_string(value, "frame_reasoning"),
        "missing_canonical_steps": string_list(value, "missing_canonical_steps"),
        "currency_passed": currency_passed,
        "currency_reasoning": optional_string(value, "currency_reasoning"),
        "stale_evidence": string_list(value, "stale_evidence"),
        "pipeline_run_id": required_string(value, "pipeline_run_id"),
    }
