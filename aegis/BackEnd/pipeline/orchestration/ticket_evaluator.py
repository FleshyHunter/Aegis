"""Coordinates routing, BA context selection, and evaluation for one ticket."""

from __future__ import annotations

from typing import Any

from pipeline.ai.services.evaluation_ai_service import EvaluationAIService
from pipeline.ai.services.routing_ai_service import RoutingAIService
from pipeline.evaluators.verdict.verdict_combiner import (
    build_final_reasoning,
    combine_final_classification,
)
from pipeline.orchestration.ba_context_step import build_ticket_ba_context
from pipeline.orchestration.evaluation_step import evaluate_candidate_building_blocks
from pipeline.orchestration.routing_step import route_ticket
from pipeline.output.result_formatter import (
    compact_ba_context,
    compact_selected_building_block,
)


def evaluate_ticket(
    *,
    ticket: dict[str, Any],
    normalized_ba: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    routing_ai_service: RoutingAIService,
    evaluation_ai_service: EvaluationAIService,
    project_context_text: str,
    user_prompt_text: str,
    pipeline_run_id: str,
    max_candidates: int,
) -> dict[str, Any]:
    routing_response, selected_building_blocks = route_ticket(
        ticket=ticket,
        building_blocks=building_blocks,
        routing_ai_service=routing_ai_service,
        project_context_text=project_context_text,
        user_prompt_text=user_prompt_text,
        pipeline_run_id=pipeline_run_id,
        max_candidates=max_candidates,
    )

    ba_context = build_ticket_ba_context(
        normalized_ba=normalized_ba,
        ticket=ticket,
    )

    evaluation_result = evaluate_candidate_building_blocks(
        ticket=ticket,
        ba_context=ba_context,
        selected_building_blocks=selected_building_blocks,
        evaluation_ai_service=evaluation_ai_service,
        project_context_text=project_context_text,
        user_prompt_text=user_prompt_text,
        pipeline_run_id=pipeline_run_id,
    )

    evaluation_response = evaluation_result["evaluation_response"]
    final_classification = combine_final_classification(evaluation_response)

    return {
        "derived_test_case_id": ticket.get("derived_test_case_id"),
        "jira_ticket_id": ticket.get("jira_ticket_id"),
        "test_case_id": ticket.get("test_case_id"),
        "result_code": ticket.get("result_code"),
        "routing": routing_response,
        "selected_building_block": compact_selected_building_block(
            evaluation_result["selected_building_block"]
        ),
        "ba_context": compact_ba_context(ba_context),
        "raw_evaluation": evaluation_result["raw_evaluation_response"],
        "evaluation": evaluation_response,
        "guard_notes": evaluation_result["guard_notes"],
        "final_classification": final_classification,
        "final_reasoning": build_final_reasoning(evaluation_response),
    }
