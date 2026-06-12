"""Normalize loaded DerivedTestCases for pipeline evaluation.

Input is the plain Python object returned by loaders.ticket_loader. Output is a
stable, Dify-safe ticket representation. In particular, label_hint is excluded
because it is answer-key data.
"""

from __future__ import annotations

from typing import Any


ALLOWED_RESULT_CODE_SOURCES = {
    "title_brackets[1]",
    "fallback_bracket_scan",
    "fallback_title_text",
    "not_found",
}

ALLOWED_TITLE_CONVENTION_STATUSES = {"standard", "outlier", "invalid"}


def normalize_ticket_table(derived_table: dict[str, Any]) -> dict[str, Any]:
    """Normalize one loaded DerivedTestCases table."""

    rows = derived_table.get("rows", [])
    if not isinstance(rows, list):
        raise ValueError("Derived test case rows must be a list")

    tickets = [
        normalize_ticket_row(row, index=index)
        for index, row in enumerate(rows)
        if isinstance(row, dict)
    ]

    return {
        "derived_test_case_table_id": derived_table.get("id"),
        "ticket_set_id": derived_table.get("ticket_set_id"),
        "raw_test_case_id": derived_table.get("raw_test_case_id"),
        "name": derived_table.get("name", ""),
        "source_filename": derived_table.get("source_filename", ""),
        "ticket_count": len(tickets),
        "tickets": tickets,
    }


def normalize_ticket_row(row: dict[str, Any], *, index: int = 0) -> dict[str, Any]:
    """Normalize one derived test case row into the pipeline ticket shape."""

    result_code_source = _clean_text(row.get("result_code_source")) or "not_found"
    if result_code_source not in ALLOWED_RESULT_CODE_SOURCES:
        result_code_source = "not_found"

    title_convention_status = _clean_text(row.get("title_convention_status")) or "invalid"
    if title_convention_status not in ALLOWED_TITLE_CONVENTION_STATUSES:
        title_convention_status = "invalid"

    return {
        "derived_test_case_id": row.get("derived_test_case_id") or f"DTC-{index + 1:04d}",
        "jira_ticket_id": _clean_text(row.get("jira_ticket_id")),
        "test_case_id": _clean_text(row.get("test_case_id")),
        "title_raw": _clean_text(row.get("title_raw")),
        "product_name": _clean_text(row.get("product_name")),
        "title_brackets": _as_string_list(row.get("title_brackets")),
        "result_code": _normalize_result_code(row.get("result_code")),
        "result_code_source": result_code_source,
        "title_convention_status": title_convention_status,
        "title_parse_warnings": _as_string_list(row.get("title_parse_warnings")),
        "test_case_name": _clean_text(row.get("test_case_name")),
        "components": _as_string_list(row.get("components")),
        "labels": _as_string_list(row.get("labels")),
        "fix_versions": _as_string_list(row.get("fix_versions")),
        "description_context": _clean_text(row.get("description_context")),
        "preconditions": _as_string_list(row.get("preconditions")),
        "steps": _normalize_steps(row.get("steps")),
        "routing_key": _clean_text(row.get("routing_key")),
    }


def normalize_tickets(derived_table: dict[str, Any]) -> list[dict[str, Any]]:
    """Convenience helper that returns only normalized ticket rows."""

    return normalize_ticket_table(derived_table)["tickets"]


def _normalize_steps(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    steps: list[dict[str, Any]] = []

    for index, step in enumerate(value):
        if not isinstance(step, dict):
            continue

        steps.append(
            {
                "step": _coerce_step_number(step.get("step"), index),
                "action": _clean_text(step.get("action")),
                "expected": _as_string_list(step.get("expected")),
            }
        )

    return steps


def _coerce_step_number(value: Any, index: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return index + 1


def _as_string_list(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, list):
        return [
            text
            for text in (_clean_text(item) for item in value)
            if text is not None
        ]

    text = _clean_text(value)
    if text is None:
        return []

    return [
        item.strip()
        for item in text.split(",")
        if item.strip()
    ]


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    return text if text else None


def _normalize_result_code(value: Any) -> str | None:
    text = _clean_text(value)
    return text.upper() if text else None
