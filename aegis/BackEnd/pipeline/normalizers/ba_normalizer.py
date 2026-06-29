"""Normalize loaded BA rule rows for pipeline currency checks.

Input is the plain Python object returned by loaders.ba_loader. Output is a
stable, pipeline-ready representation. This module does not call Dify and does
not decide final pass/fail verdicts.
"""

from __future__ import annotations

import re
from typing import Any


BA_FIELD_ALIASES = {
    "release": ["release"],
    "result_code": ["result code", "result_code"],
    "exception_label_go": ["exception label(go)", "exception_label_go"],
    "exception_colour": ["exception colour", "exception_colour"],
    "auto_hold_up": ["auto hold up?", "auto hold up", "auto_hold_up"],
    "applicable_to_profiler": [
        "applicable to profiler?",
        "applicable to profiler",
        "applicable_to_profiler",
    ],
    "can_abort_transaction_in_profiler": [
        "can abort transaction in profiler?",
        "can abort transaction in profiler",
        "can_abort_transaction_in_profiler",
    ],
    "action1_label": ["action1_label", "action1 label"],
    "action2_label": ["action2_label", "action2 label"],
    "action3_label": ["action3_label", "action3 label"],
    "validity_in_current_project": [
        "validity in current project",
        "validity_in_current_project",
    ],
    "deprecated_invisible_obsolete": [
        "deprecated / invisible / obsolete",
        "deprecated invisible obsolete",
        "deprecated_invisible_obsolete",
    ],
}


def normalize_ba_list(ba_list: dict[str, Any]) -> dict[str, Any]:
    """Normalize all BA rows from one loaded BAList document."""

    rows = ba_list.get("rows", [])
    if not isinstance(rows, list):
        raise ValueError("BA list rows must be a list")

    rules = [
        normalize_ba_row(row, index=index)
        for index, row in enumerate(rows)
        if isinstance(row, dict)
    ]
    rules_by_result_code = group_ba_rules_by_result_code(rules)
    latest_by_result_code = {
        result_code: latest_ba_rule_for_result_code(grouped_rules)
        for result_code, grouped_rules in rules_by_result_code.items()
    }

    return {
        "ba_list_id": ba_list.get("id"),
        "name": ba_list.get("name", ""),
        "row_count": len(rules),
        "rules": rules,
        "rules_by_result_code": rules_by_result_code,
        "latest_by_result_code": latest_by_result_code,
    }


def normalize_ba_row(row: dict[str, Any], *, index: int = 0) -> dict[str, Any]:
    """Normalize one BA CSV row into the locked BA rule shape."""

    action1_label = _clean_text(_get_value(row, "action1_label"))
    action2_label = _clean_text(_get_value(row, "action2_label"))
    action3_label = _clean_text(_get_value(row, "action3_label"))
    validity = _clean_text(_get_value(row, "validity_in_current_project"))
    deprecated = _clean_text(_get_value(row, "deprecated_invisible_obsolete"))

    return {
        "ba_rule_id": f"BA-{index + 1:04d}",
        "release": _clean_text(_get_value(row, "release")),
        "result_code": _normalize_result_code(_get_value(row, "result_code")),
        "exception_label_go": _clean_text(_get_value(row, "exception_label_go")),
        "exception_colour": _clean_text(_get_value(row, "exception_colour")),
        "auto_hold_up": _clean_text(_get_value(row, "auto_hold_up")),
        "applicable_to_profiler": _clean_text(_get_value(row, "applicable_to_profiler")),
        "can_abort_transaction_in_profiler": _clean_text(
            _get_value(row, "can_abort_transaction_in_profiler")
        ),
        "action1_label": action1_label,
        "action2_label": action2_label,
        "action3_label": action3_label,
        "action_labels": [
            label
            for label in [action1_label, action2_label, action3_label]
            if label is not None
        ],
        "validity_in_current_project": validity,
        "deprecated_invisible_obsolete": deprecated,
        "is_valid_in_current_project": _is_valid_in_current_project(validity),
        "is_deprecated_or_obsolete": _is_deprecated_or_obsolete(deprecated),
        "raw_row": dict(row),
    }


def group_ba_rules_by_result_code(
    rules: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    """Group normalized BA rules by result code and sort each group by release."""

    grouped: dict[str, list[dict[str, Any]]] = {}

    for rule in rules:
        result_code = rule.get("result_code")
        if not result_code:
            continue

        grouped.setdefault(str(result_code), []).append(rule)

    for result_code, grouped_rules in grouped.items():
        grouped[result_code] = sorted(
            grouped_rules,
            key=lambda rule: _release_sort_key(rule.get("release")),
        )

    return grouped


def latest_ba_rule_for_result_code(
    rules: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """Return the highest-release BA rule from a group of same-result-code rows."""

    if not rules:
        return None

    return sorted(
        rules,
        key=lambda rule: _release_sort_key(rule.get("release")),
    )[-1]


def _get_value(row: dict[str, Any], canonical_field: str) -> Any:
    normalized_row = {
        _normalize_key(key): value
        for key, value in row.items()
    }

    for alias in BA_FIELD_ALIASES[canonical_field]:
        value = normalized_row.get(_normalize_key(alias))
        if value is not None:
            return value

    return None


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.strip().lower()).strip()


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    return text if text else None


def _normalize_result_code(value: Any) -> str | None:
    text = _clean_text(value)
    return text.upper() if text else None


def _is_valid_in_current_project(value: str | None) -> bool:
    if value is None:
        return False

    return value.strip().lower() == "valid"


def _is_deprecated_or_obsolete(value: str | None) -> bool:
    if value is None:
        return False

    normalized = value.strip().lower()
    return any(
        keyword in normalized
        for keyword in ["deprecated", "invisible", "obsolete"]
    )


def _release_sort_key(value: Any) -> tuple[int, int, str]:
    text = "" if value is None else str(value).strip()
    normalized = text.lower()
    match = re.search(r"(\d+)", text)
    release_family_rank = 1 if re.search(r"\bsr\s*\d+", normalized) else 0

    if not match:
        return (release_family_rank, 0, text)

    return (release_family_rank, int(match.group(1)), text)
