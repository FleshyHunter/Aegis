"""Phase 1 Building Block routing orchestration."""

from __future__ import annotations

from typing import Any

from pipeline.ai.schemas.common import PipelineResponseValidationError
from pipeline.ai.schemas.response_debug import log_ai_validation_failure
from pipeline.ai.schemas.response_parser import extract_result
from pipeline.ai.schemas.routing_response_schema import validate_routing_response
from pipeline.ai.services.routing_ai_service import RoutingAIService
from pipeline.evaluators.routing.building_block_router import select_candidate_building_blocks
from pipeline.payloads.routing_payload_builder import build_routing_payload


def route_ticket(
    *,
    ticket: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    routing_ai_service: RoutingAIService,
    project_context_text: str,
    user_prompt_text: str,
    pipeline_run_id: str,
    max_candidates: int,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    routing_payload = build_routing_payload(
        ticket=ticket,
        building_blocks=building_blocks,
        project_context_text=project_context_text,
        user_prompt_text=user_prompt_text,
        pipeline_run_id=pipeline_run_id,
    )
    routing_outputs = routing_ai_service.route(routing_payload)
    extracted_routing = extract_result(routing_outputs)

    try:
        routing_response = validate_routing_response(extracted_routing)
    except PipelineResponseValidationError:
        log_ai_validation_failure(
            phase="Phase 1 routing",
            outputs=routing_outputs,
            extracted=extracted_routing,
            ticket=ticket,
            building_block={},
        )
        raise

    selected_building_blocks = select_candidate_building_blocks(
        routing_response,
        building_blocks,
        limit=max_candidates,
    )

    return routing_response, selected_building_blocks
