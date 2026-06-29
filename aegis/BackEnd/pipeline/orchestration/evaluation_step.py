"""Phase 2 frame/currency evaluation orchestration."""

from __future__ import annotations

from typing import Any, TypedDict

from pipeline.ai.schemas.common import PipelineResponseValidationError
from pipeline.ai.schemas.evaluation_response_schema import validate_evaluation_response
from pipeline.ai.schemas.response_debug import log_ai_validation_failure
from pipeline.ai.schemas.response_parser import extract_result
from pipeline.ai.services.evaluation_ai_service import EvaluationAIService
from pipeline.evaluators.guards.currency_checker import guard_currency_evaluation
from pipeline.evaluators.guards.frame_checker import guard_frame_evaluation
from pipeline.payloads.evaluation_payload_builder import build_evaluation_payload


class EvaluationStepResult(TypedDict):
    evaluation_response: dict[str, Any] | None
    raw_evaluation_response: dict[str, Any] | None
    guard_notes: list[str]
    selected_building_block: dict[str, Any] | None


def evaluate_candidate_building_blocks(
    *,
    ticket: dict[str, Any],
    ba_context: dict[str, Any],
    selected_building_blocks: list[dict[str, Any]],
    evaluation_ai_service: EvaluationAIService,
    project_context_text: str,
    user_prompt_text: str,
    pipeline_run_id: str,
) -> EvaluationStepResult:
    evaluation_response = None
    raw_evaluation_response = None
    guard_notes: list[str] = []
    selected_building_block = None

    for building_block in selected_building_blocks:
        evaluation_payload = build_evaluation_payload(
            ticket=ticket,
            ba_context=ba_context,
            building_block=building_block,
            project_context_text=project_context_text,
            user_prompt_text=user_prompt_text,
            pipeline_run_id=pipeline_run_id,
        )
        evaluation_outputs = evaluation_ai_service.evaluate(evaluation_payload)
        extracted_evaluation = extract_result(evaluation_outputs)

        try:
            candidate_evaluation = validate_evaluation_response(extracted_evaluation)
        except PipelineResponseValidationError:
            log_ai_validation_failure(
                phase="Phase 2 evaluation",
                outputs=evaluation_outputs,
                extracted=extracted_evaluation,
                ticket=ticket,
                building_block=building_block,
            )
            raise

        raw_evaluation_response = candidate_evaluation
        frame_checked_evaluation, frame_guard_notes = guard_frame_evaluation(candidate_evaluation)
        currency_checked_evaluation, currency_guard_notes = guard_currency_evaluation(
            evaluation=frame_checked_evaluation,
            ticket=ticket,
            ba_context=ba_context,
        )
        evaluation_response = currency_checked_evaluation
        guard_notes = frame_guard_notes + currency_guard_notes
        selected_building_block = building_block

        if evaluation_response["building_block_confirmed"]:
            break

    return {
        "evaluation_response": evaluation_response,
        "raw_evaluation_response": raw_evaluation_response,
        "guard_notes": guard_notes,
        "selected_building_block": selected_building_block,
    }
