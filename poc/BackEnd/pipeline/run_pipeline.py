"""Pipeline entrypoint for AEGIS Dify-backed evaluation.

The TypeScript backend starts this script after it creates a PipelineRun. This
script loads persisted inputs, normalizes them, calls Dify Phase 1 routing and
Phase 2 evaluation workflows, and prints a JSON summary to stdout.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from pipeline.clients.dify_client import DifyClient, MockDifyClient
from pipeline.config import DifyConfig
from pipeline.evaluators.guards.currency_checker import guard_currency_evaluation
from pipeline.evaluators.guards.frame_checker import guard_frame_evaluation
from pipeline.evaluators.routing.building_block_router import select_candidate_building_blocks
from pipeline.evaluators.verdict.verdict_combiner import (
    build_final_reasoning,
    combine_final_classification,
)
from pipeline.loaders.ba_loader import load_ba_list
from pipeline.loaders.building_block_loader import load_building_blocks
from pipeline.loaders.ticket_loader import load_tickets
from pipeline.normalizers.ba_normalizer import normalize_ba_list
from pipeline.normalizers.building_block_normalizer import normalize_building_blocks
from pipeline.normalizers.ticket_normalizer import normalize_ticket_table
from pipeline.payloads.evaluation_payload_builder import build_evaluation_payload
from pipeline.payloads.payload_utils import build_ba_context_for_ticket
from pipeline.payloads.routing_payload_builder import build_routing_payload
from pipeline.schemas import (
    validate_evaluation_response,
    validate_routing_response,
)


DEFAULT_MAX_EVALUATION_CANDIDATES = 2


def main() -> None:
    output = run_pipeline_from_env()
    print(json.dumps(output, ensure_ascii=True, sort_keys=True))


def run_pipeline_from_env() -> dict[str, Any]:
    pipeline_run_id = _required_env("PIPELINE_RUN_ID")
    ticket_set_id = _required_env("TICKET_SET_ID")
    ba_list_id = _required_env("BA_LIST_ID")
    building_block_ids = _csv_env("BUILDING_BLOCK_IDS")
    user_prompt_text = os.getenv("USER_PROMPT", "").strip()
    project_context_text = os.getenv("PROJECT_CONTEXT_TEXT", "").strip()

    if not building_block_ids:
        raise ValueError("BUILDING_BLOCK_IDS must contain at least one BuildingBlock id.")

    use_mock = _truthy(os.getenv("USE_MOCK_LLM"))
    routing_client, evaluation_client = _build_dify_clients(use_mock=use_mock)
    max_candidates = _int_env("MAX_EVALUATION_CANDIDATES", DEFAULT_MAX_EVALUATION_CANDIDATES)

    ba_list = load_ba_list(ba_list_id)
    building_block_docs = load_building_blocks(building_block_ids)
    derived_ticket_table = load_tickets(ticket_set_id)

    normalized_ba = normalize_ba_list(ba_list)
    normalized_building_blocks = normalize_building_blocks(building_block_docs)
    normalized_ticket_table = normalize_ticket_table(derived_ticket_table)

    results = [
        evaluate_ticket(
            ticket=ticket,
            normalized_ba=normalized_ba,
            building_blocks=normalized_building_blocks,
            routing_client=routing_client,
            evaluation_client=evaluation_client,
            project_context_text=project_context_text,
            user_prompt_text=user_prompt_text,
            pipeline_run_id=pipeline_run_id,
            max_candidates=max_candidates,
        )
        for ticket in normalized_ticket_table["tickets"]
    ]

    counts = _summarize_results(results)

    return {
        "status": "completed",
        "pipeline_run_id": pipeline_run_id,
        "ticket_set_id": ticket_set_id,
        "ba_list_id": ba_list_id,
        "building_block_ids": building_block_ids,
        "ticket_count": normalized_ticket_table["ticket_count"],
        "counts": counts,
        "results": results,
    }


def evaluate_ticket(
    *,
    ticket: dict[str, Any],
    normalized_ba: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    routing_client: DifyClient | MockDifyClient,
    evaluation_client: DifyClient | MockDifyClient,
    project_context_text: str,
    user_prompt_text: str,
    pipeline_run_id: str,
    max_candidates: int,
) -> dict[str, Any]:
    routing_payload = build_routing_payload(
        ticket=ticket,
        building_blocks=building_blocks,
        project_context_text=project_context_text,
        user_prompt_text=user_prompt_text,
        pipeline_run_id=pipeline_run_id,
    )
    routing_outputs = routing_client.run_workflow_outputs(routing_payload)
    routing_response = validate_routing_response(_extract_result(routing_outputs))
    selected_building_blocks = select_candidate_building_blocks(
        routing_response,
        building_blocks,
        limit=max_candidates,
    )

    ba_context = build_ba_context_for_ticket(
        normalized_ba=normalized_ba,
        result_code=ticket.get("result_code"),
    )

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
        evaluation_outputs = evaluation_client.run_workflow_outputs(evaluation_payload)
        candidate_evaluation = validate_evaluation_response(_extract_result(evaluation_outputs))
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

    final_classification = combine_final_classification(evaluation_response)

    return {
        "derived_test_case_id": ticket.get("derived_test_case_id"),
        "jira_ticket_id": ticket.get("jira_ticket_id"),
        "test_case_id": ticket.get("test_case_id"),
        "result_code": ticket.get("result_code"),
        "routing": routing_response,
        "selected_building_block": _compact_selected_building_block(selected_building_block),
        "ba_context": _compact_ba_context(ba_context),
        "raw_evaluation": raw_evaluation_response,
        "evaluation": evaluation_response,
        "guard_notes": guard_notes,
        "final_classification": final_classification,
        "final_reasoning": build_final_reasoning(evaluation_response),
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


def _extract_result(outputs: dict[str, Any]) -> Any:
    if "result" in outputs:
        return outputs["result"]

    return outputs


def _compact_selected_building_block(building_block: dict[str, Any] | None) -> dict[str, Any] | None:
    if not building_block:
        return None

    return {
        "building_block_id": building_block.get("building_block_id"),
        "block_id": building_block.get("block_id"),
        "title": building_block.get("title"),
        "version": building_block.get("version"),
    }


def _compact_ba_context(ba_context: dict[str, Any]) -> dict[str, Any]:
    return {
        "result_code": ba_context.get("result_code"),
        "mapping_status": ba_context.get("mapping_status"),
        "latest_rule": _compact_ba_rule(ba_context.get("latest_rule")),
        "historical_rule_count": len(ba_context.get("historical_rules") or []),
    }


def _compact_ba_rule(rule: Any) -> dict[str, Any] | None:
    if not isinstance(rule, dict):
        return None

    return {
        "ba_rule_id": rule.get("ba_rule_id"),
        "release": rule.get("release"),
        "result_code": rule.get("result_code"),
        "exception_colour": rule.get("exception_colour"),
        "action_labels": rule.get("action_labels"),
        "is_valid_in_current_project": rule.get("is_valid_in_current_project"),
        "is_deprecated_or_obsolete": rule.get("is_deprecated_or_obsolete"),
    }


def _summarize_results(results: list[dict[str, Any]]) -> dict[str, int]:
    counts = {
        "routed_count": 0,
        "evaluated_count": 0,
        "passed_count": 0,
        "failed_count": 0,
        "skipped_count": 0,
    }

    for result in results:
        if result.get("routing", {}).get("top_candidates"):
            counts["routed_count"] += 1

        if result.get("evaluation"):
            counts["evaluated_count"] += 1

        classification = result.get("final_classification")
        if classification == "Pass":
            counts["passed_count"] += 1
        elif classification == "Failed":
            counts["failed_count"] += 1
        elif classification == "Skipped":
            counts["skipped_count"] += 1

    return counts


def _required_env(key: str) -> str:
    value = os.getenv(key, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {key}")

    return value


def _csv_env(key: str) -> list[str]:
    return [item.strip() for item in os.getenv(key, "").split(",") if item.strip()]


def _truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "y"}


def _int_env(key: str, default: int) -> int:
    value = os.getenv(key, "").strip()
    if not value:
        return default

    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError(f"{key} must be an integer.") from exc

    return max(1, parsed)


if __name__ == "__main__":
    main()
