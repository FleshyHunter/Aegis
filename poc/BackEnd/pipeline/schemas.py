"""Runtime response contracts and validators for the Python pipeline."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


Confidence = Literal["high", "medium", "low"]
FinalClassification = Literal["Pass", "Failed", "Skipped"]


class RoutingCandidate(TypedDict):
    building_block_id: str
    block_id: str
    title: str
    confidence: Confidence
    reasoning: str


class RoutingResponse(TypedDict):
    top_candidates: list[RoutingCandidate]
    routing_summary: str
    pipeline_run_id: str


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


class PipelineResponseValidationError(ValueError):
    """Raised when a Dify workflow response does not match the expected contract."""


def validate_routing_response(value: Any) -> RoutingResponse:
    if not isinstance(value, dict):
        raise PipelineResponseValidationError("Routing response must be an object.")

    top_candidates = value.get("top_candidates")
    if not isinstance(top_candidates, list):
        raise PipelineResponseValidationError("Routing response top_candidates must be a list.")

    candidates: list[RoutingCandidate] = []
    for index, candidate in enumerate(top_candidates):
        if not isinstance(candidate, dict):
            raise PipelineResponseValidationError(f"Routing candidate {index + 1} must be an object.")

        confidence = _required_string(candidate, "confidence")
        if confidence not in {"high", "medium", "low"}:
            raise PipelineResponseValidationError(
                f"Routing candidate {index + 1} confidence must be high, medium, or low."
            )

        candidates.append(
            {
                "building_block_id": _required_string(candidate, "building_block_id"),
                "block_id": _required_string(candidate, "block_id"),
                "title": _required_string(candidate, "title"),
                "confidence": confidence,  # type: ignore[typeddict-item]
                "reasoning": _required_string(candidate, "reasoning"),
            }
        )

    return {
        "top_candidates": candidates,
        "routing_summary": _required_string(value, "routing_summary"),
        "pipeline_run_id": _required_string(value, "pipeline_run_id"),
    }


def validate_evaluation_response(value: Any) -> EvaluationResponse:
    if not isinstance(value, dict):
        raise PipelineResponseValidationError("Evaluation response must be an object.")

    confirmed = _required_bool(value, "building_block_confirmed")
    frame_passed = _optional_bool(value, "frame_passed")
    currency_passed = _optional_bool(value, "currency_passed")

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
        "building_block_id": _required_string(value, "building_block_id"),
        "block_id": _required_string(value, "block_id"),
        "building_block_confirmation_reasoning": _required_string(
            value,
            "building_block_confirmation_reasoning",
        ),
        "frame_passed": frame_passed,
        "frame_reasoning": _optional_string(value, "frame_reasoning"),
        "missing_canonical_steps": _string_list(value, "missing_canonical_steps"),
        "currency_passed": currency_passed,
        "currency_reasoning": _optional_string(value, "currency_reasoning"),
        "stale_evidence": _string_list(value, "stale_evidence"),
        "pipeline_run_id": _required_string(value, "pipeline_run_id"),
    }


def _required_string(value: dict[str, Any], field: str) -> str:
    field_value = value.get(field)
    if not isinstance(field_value, str):
        raise PipelineResponseValidationError(f"{field} must be a string.")

    return field_value


def _optional_string(value: dict[str, Any], field: str) -> str | None:
    field_value = value.get(field)
    if field_value is None:
        return None

    if not isinstance(field_value, str):
        raise PipelineResponseValidationError(f"{field} must be a string or null.")

    return field_value


def _required_bool(value: dict[str, Any], field: str) -> bool:
    field_value = value.get(field)
    if not isinstance(field_value, bool):
        coerced = _coerce_bool_string(field_value)
        if coerced is None:
            raise PipelineResponseValidationError(f"{field} must be a boolean.")

        return coerced

    return field_value


def _optional_bool(value: dict[str, Any], field: str) -> bool | None:
    field_value = value.get(field)
    if field_value is None:
        return None

    if not isinstance(field_value, bool):
        coerced = _coerce_bool_string(field_value)
        if coerced is None:
            raise PipelineResponseValidationError(f"{field} must be a boolean or null.")

        return coerced

    return field_value


def _coerce_bool_string(value: Any) -> bool | None:
    if not isinstance(value, str):
        return None

    normalized = value.strip().lower()
    if normalized == "true":
        return True

    if normalized == "false":
        return False

    return None


def _string_list(value: dict[str, Any], field: str) -> list[str]:
    field_value = value.get(field)
    if not isinstance(field_value, list):
        raise PipelineResponseValidationError(f"{field} must be a list.")

    if not all(isinstance(item, str) for item in field_value):
        raise PipelineResponseValidationError(f"{field} must contain only strings.")

    return field_value
