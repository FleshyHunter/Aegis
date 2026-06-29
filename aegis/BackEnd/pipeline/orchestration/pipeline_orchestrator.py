"""Run-level pipeline orchestration."""

from __future__ import annotations

from typing import Any

from pipeline.ai.clients.dify_client import DifyClient
from pipeline.ai.clients.mock_dify_client import MockDifyClient
from pipeline.ai.services.evaluation_ai_service import EvaluationAIService
from pipeline.ai.services.routing_ai_service import RoutingAIService
from pipeline.config import DifyConfig
from pipeline.execution.parallel_runner import run_ordered_parallel
from pipeline.execution.rate_limiter import DifyRateLimiter
from pipeline.loaders.ba_loader import load_ba_list
from pipeline.loaders.building_block_loader import load_building_blocks
from pipeline.loaders.ticket_loader import load_tickets
from pipeline.normalizers.ba_normalizer import normalize_ba_list
from pipeline.normalizers.building_block_normalizer import normalize_building_blocks
from pipeline.normalizers.ticket_normalizer import normalize_ticket_table
from pipeline.orchestration.ticket_evaluator import evaluate_ticket
from pipeline.output.result_formatter import empty_ba_context, summarize_results


def run_pipeline(
    *,
    pipeline_run_id: str,
    ticket_set_id: str,
    ba_list_id: str,
    building_block_ids: list[str],
    project_context_text: str,
    user_prompt_text: str,
    use_mock: bool,
    max_candidates: int,
    max_parallel_tickets: int,
    max_dify_rpm: int,
) -> dict[str, Any]:
    routing_client, evaluation_client = _build_dify_clients(use_mock=use_mock)
    dify_rate_limiter = DifyRateLimiter(
        rpm=max_dify_rpm,
        enabled=not use_mock,
    )
    routing_ai_service = RoutingAIService(routing_client, dify_rate_limiter)
    evaluation_ai_service = EvaluationAIService(evaluation_client, dify_rate_limiter)

    ba_list = load_ba_list(ba_list_id) if ba_list_id else None
    building_block_docs = load_building_blocks(building_block_ids)
    derived_ticket_table = load_tickets(ticket_set_id)

    normalized_ba = normalize_ba_list(ba_list) if ba_list else empty_ba_context()
    normalized_building_blocks = normalize_building_blocks(building_block_docs)
    normalized_ticket_table = normalize_ticket_table(derived_ticket_table)
    tickets = normalized_ticket_table["tickets"]

    def evaluate_one(ticket: dict[str, Any]) -> dict[str, Any]:
        return evaluate_ticket(
            ticket=ticket,
            normalized_ba=normalized_ba,
            building_blocks=normalized_building_blocks,
            routing_ai_service=routing_ai_service,
            evaluation_ai_service=evaluation_ai_service,
            project_context_text=project_context_text,
            user_prompt_text=user_prompt_text,
            pipeline_run_id=pipeline_run_id,
            max_candidates=max_candidates,
        )

    results = run_ordered_parallel(
        items=tickets,
        worker=evaluate_one,
        max_workers=max_parallel_tickets,
    )

    return {
        "status": "completed",
        "pipeline_run_id": pipeline_run_id,
        "ticket_set_id": ticket_set_id,
        "ba_list_id": ba_list_id,
        "building_block_ids": building_block_ids,
        "ticket_count": normalized_ticket_table["ticket_count"],
        "counts": summarize_results(results),
        "results": results,
    }


def _build_dify_clients(
    *,
    use_mock: bool,
) -> tuple[DifyClient | MockDifyClient, DifyClient | MockDifyClient]:
    if use_mock:
        mock_client = MockDifyClient()
        return mock_client, mock_client

    return (
        DifyClient(DifyConfig.from_env(api_key_env="DIFY_ROUTING_API_KEY")),
        DifyClient(DifyConfig.from_env(api_key_env="DIFY_EVALUATION_API_KEY")),
    )
