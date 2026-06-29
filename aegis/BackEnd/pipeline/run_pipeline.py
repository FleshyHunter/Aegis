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

from pipeline.orchestration.pipeline_orchestrator import run_pipeline


DEFAULT_MAX_EVALUATION_CANDIDATES = 2
DEFAULT_MAX_DIFY_RPM = 60
DEFAULT_MAX_PARALLEL_TICKETS = 2


def main() -> None:
    output = run_pipeline_from_env()
    print(json.dumps(output, ensure_ascii=True, sort_keys=True))


def run_pipeline_from_env() -> dict[str, Any]:
    pipeline_run_id = _required_env("PIPELINE_RUN_ID")
    ticket_set_id = _required_env("TICKET_SET_ID")
    ba_list_id = os.getenv("BA_LIST_ID", "").strip()
    building_block_ids = _csv_env("BUILDING_BLOCK_IDS")
    user_prompt_text = os.getenv("USER_PROMPT", "").strip()
    project_context_text = os.getenv("PROJECT_CONTEXT_TEXT", "").strip()

    if not building_block_ids:
        raise ValueError("BUILDING_BLOCK_IDS must contain at least one BuildingBlock id.")

    return run_pipeline(
        pipeline_run_id=pipeline_run_id,
        ticket_set_id=ticket_set_id,
        ba_list_id=ba_list_id,
        building_block_ids=building_block_ids,
        project_context_text=project_context_text,
        user_prompt_text=user_prompt_text,
        use_mock=_truthy(os.getenv("USE_MOCK_LLM")),
        max_candidates=_int_env("MAX_EVALUATION_CANDIDATES", DEFAULT_MAX_EVALUATION_CANDIDATES),
        max_parallel_tickets=_int_env("MAX_PARALLEL_TICKETS", DEFAULT_MAX_PARALLEL_TICKETS),
        max_dify_rpm=_int_env("MAX_DIFY_RPM", DEFAULT_MAX_DIFY_RPM),
    )


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
