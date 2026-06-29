"""Deterministic Dify-compatible client for local pipeline tests."""

from __future__ import annotations

import json
from typing import Any

from pipeline.ai.clients.dify_client import extract_outputs


class MockDifyClient:
    """Deterministic local client for pipeline smoke tests without network."""

    def run_workflow(self, payload: dict[str, Any]) -> dict[str, Any]:
        inputs = payload.get("inputs", {})
        if "routing_prompt" in inputs:
            candidates = _parse_json_string(inputs.get("bb_candidates_json"), [])
            first_candidate = candidates[0] if candidates else {}
            return {
                "data": {
                    "outputs": {
                        "result": {
                            "top_candidates": [
                                {
                                    "building_block_id": first_candidate.get("building_block_id", ""),
                                    "block_id": first_candidate.get("block_id", ""),
                                    "title": first_candidate.get("title", ""),
                                    "confidence": "high" if first_candidate else "low",
                                    "reasoning": "Mock routing selected the first candidate.",
                                }
                            ] if first_candidate else [],
                            "routing_summary": "Mock routing response.",
                            "pipeline_run_id": inputs.get("pipeline_run_id", ""),
                        }
                    }
                }
            }

        if "evaluation_prompt" in inputs:
            building_block = _parse_json_string(inputs.get("building_block_json"), {})
            ba_context = _parse_json_string(inputs.get("ba_context_json"), {})
            ba_unavailable = (
                ba_context.get("mapping_status") == "unavailable"
                or ba_context.get("currency_required") is False
            )
            currency_passed = (
                None
                if ba_unavailable
                else ba_context.get("mapping_status") != "not_found"
                and ba_context.get("latest_rule") is not None
            )
            return {
                "data": {
                    "outputs": {
                        "result": {
                            "building_block_confirmed": bool(building_block),
                            "building_block_id": building_block.get("building_block_id", ""),
                            "block_id": building_block.get("block_id", ""),
                            "building_block_confirmation_reasoning": "Mock evaluation confirmed the selected Building Block.",
                            "frame_passed": True,
                            "frame_reasoning": "Mock frame response.",
                            "missing_canonical_steps": [],
                            "currency_passed": currency_passed,
                            "currency_reasoning": _mock_currency_reasoning(currency_passed),
                            "stale_evidence": [] if currency_passed is not False else ["No latest BA rule found for result_code."],
                            "pipeline_run_id": inputs.get("pipeline_run_id", ""),
                        }
                    }
                }
            }

        return {
            "data": {
                "outputs": {
                    "building_block": {
                        "matched": True,
                        "building_block_id": "",
                        "block_id": "",
                        "title": "",
                        "version": "",
                        "explanation": "Mock routing response.",
                    },
                    "frame": {
                        "passed": True,
                        "missing_steps": [],
                        "explanation": "Mock frame response.",
                    },
                    "currency": {
                        "passed": True,
                        "ba_rule_id": "",
                        "ba_version_used": "",
                        "explanation": "Mock currency response.",
                    },
                }
            }
        }

    def run_workflow_outputs(self, payload: dict[str, Any]) -> dict[str, Any]:
        return extract_outputs(self.run_workflow(payload))


def _parse_json_string(value: Any, default: Any) -> Any:
    if not isinstance(value, str):
        return default

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def _mock_currency_reasoning(currency_passed: bool | None) -> str:
    if currency_passed is True:
        return "Mock currency response."

    if currency_passed is None:
        return "BA rules were not provided; requirement currency was not assessed."

    return "Mock currency failure because no BA rule mapping was found."
