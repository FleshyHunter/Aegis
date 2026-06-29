"""Response contract for Phase 1 Building Block routing."""

from __future__ import annotations

from typing import Any, Literal, TypedDict

from pipeline.ai.schemas.common import (
    PipelineResponseValidationError,
    required_string,
)


Confidence = Literal["high", "medium", "low"]


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

        confidence = required_string(candidate, "confidence")
        if confidence not in {"high", "medium", "low"}:
            raise PipelineResponseValidationError(
                f"Routing candidate {index + 1} confidence must be high, medium, or low."
            )

        candidates.append(
            {
                "building_block_id": required_string(candidate, "building_block_id"),
                "block_id": required_string(candidate, "block_id"),
                "title": required_string(candidate, "title"),
                "confidence": confidence,  # type: ignore[typeddict-item]
                "reasoning": required_string(candidate, "reasoning"),
            }
        )

    return {
        "top_candidates": candidates,
        "routing_summary": required_string(value, "routing_summary"),
        "pipeline_run_id": required_string(value, "pipeline_run_id"),
    }
