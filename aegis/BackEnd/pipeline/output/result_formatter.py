"""Formatting helpers for pipeline output payloads."""

from __future__ import annotations

from typing import Any


def compact_selected_building_block(building_block: dict[str, Any] | None) -> dict[str, Any] | None:
    if not building_block:
        return None

    return {
        "building_block_id": building_block.get("building_block_id"),
        "block_id": building_block.get("block_id"),
        "title": building_block.get("title"),
        "version": building_block.get("version"),
    }


def compact_ba_context(ba_context: dict[str, Any]) -> dict[str, Any]:
    return {
        "result_code": ba_context.get("result_code"),
        "mapping_status": ba_context.get("mapping_status"),
        "currency_required": ba_context.get("currency_required"),
        "latest_rule": compact_ba_rule(ba_context.get("latest_rule")),
        "historical_rule_count": len(ba_context.get("historical_rules") or []),
    }


def compact_ba_rule(rule: Any) -> dict[str, Any] | None:
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


def summarize_results(results: list[dict[str, Any]]) -> dict[str, int]:
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


def empty_ba_context() -> dict[str, Any]:
    return {
        "ba_available": False,
        "rules_by_result_code": {},
        "latest_by_result_code": {},
        "row_count": 0,
    }
