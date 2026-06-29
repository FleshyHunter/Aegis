"""Normalize loaded Building Block documents for pipeline frame checks.

Input is the plain Python object returned by loaders.building_block_loader.
Output is the stable BB shape used for routing and frame conformance checks.
"""

from __future__ import annotations

import json
import re
from typing import Any


def normalize_building_block(building_block: dict[str, Any]) -> dict[str, Any]:
    """Normalize one loaded BuildingBlock document."""

    preview_text = _normalize_line_breaks(building_block.get("preview_text", ""))
    block_id, title_from_heading = _extract_title_heading(preview_text)

    return {
        "building_block_id": building_block.get("id"),
        "block_id": _extract_block_id(preview_text) or block_id,
        "title": _extract_title(preview_text)
        or title_from_heading
        or _title_from_file_name(building_block.get("name") or building_block.get("file_name")),
        "version": _extract_version(preview_text),
        "routing_rule": _extract_section(
            preview_text,
            r"^Routing Rule$",
            [r"^Description \(AI Context\)$", r"^Description$", r"^Preconditions$"],
        ),
        "description": _extract_section(
            preview_text,
            r"^Description \(AI Context\)$|^Description$",
            [r"^Preconditions$", r"^Test Steps"],
        ),
        "preconditions": _extract_preconditions(preview_text),
        "test_steps": _extract_test_steps(preview_text),
    }


def normalize_building_blocks(
    building_blocks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Normalize multiple loaded BuildingBlock documents."""

    return [normalize_building_block(item) for item in building_blocks]


def _extract_title_heading(text: str) -> tuple[str | None, str | None]:
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    match = re.match(r"^(BB\d+)\s*[—-]\s*(.+)$", first_line, flags=re.IGNORECASE)

    if not match:
        return None, None

    return match.group(1).upper(), match.group(2).strip()


def _extract_block_id(text: str) -> str | None:
    value = _extract_label_value(text, r"Block ID")
    return value.upper() if value else None


def _extract_title(text: str) -> str | None:
    return _extract_label_value(text, r"Title")


def _extract_version(text: str) -> str | None:
    return _extract_label_value(text, r"Version(?:\s*\(Release\))?")


def _extract_label_value(text: str, label_pattern: str) -> str | None:
    pattern = rf"^{label_pattern}\s*:\s*(.+)$"
    match = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)

    if not match:
        return None

    return _clean_text(match.group(1))


def _extract_section(
    text: str,
    start_heading_pattern: str,
    stop_heading_patterns: list[str],
) -> str | None:
    lines = text.splitlines()
    start_index = None

    for index, line in enumerate(lines):
        if re.match(start_heading_pattern, line.strip(), flags=re.IGNORECASE):
            start_index = index + 1
            break

    if start_index is None:
        return None

    stop_index = len(lines)
    for index in range(start_index, len(lines)):
        candidate = lines[index].strip()
        if any(
            re.match(pattern, candidate, flags=re.IGNORECASE)
            for pattern in stop_heading_patterns
        ):
            stop_index = index
            break

    return _clean_multiline_text("\n".join(lines[start_index:stop_index]))


def _extract_preconditions(text: str) -> list[str]:
    section = _extract_section(
        text,
        r"^Preconditions$",
        [r"^Test Steps", r"^test_steps\s*:"],
    )

    if not section:
        return []

    return [
        _strip_list_prefix(line)
        for line in section.splitlines()
        if _strip_list_prefix(line)
    ]


def _extract_test_steps(text: str) -> list[dict[str, Any]]:
    marker = re.search(r"test_steps\s*:", text, flags=re.IGNORECASE)
    if not marker:
        return []

    start = text.find("[", marker.end())
    if start == -1:
        raise ValueError("Building Block test_steps block is missing a JSON array")

    try:
        parsed, _ = json.JSONDecoder().raw_decode(text[start:])
    except json.JSONDecodeError as error:
        raise ValueError(f"Building Block test_steps block is invalid JSON: {error}") from error

    if not isinstance(parsed, list):
        raise ValueError("Building Block test_steps must be a JSON array")

    return [_normalize_step(step, index) for index, step in enumerate(parsed)]


def _normalize_step(step: Any, index: int) -> dict[str, Any]:
    if not isinstance(step, dict):
        raise ValueError(f"Building Block test step {index + 1} must be an object")

    expected = step.get("expected", [])
    if isinstance(expected, str):
        expected_items = [
            line.strip()
            for line in _normalize_line_breaks(expected).splitlines()
            if line.strip()
        ]
    elif isinstance(expected, list):
        expected_items = [
            str(item).strip()
            for item in expected
            if str(item).strip()
        ]
    else:
        expected_items = []

    return {
        "step": _coerce_step_number(step.get("step"), index),
        "action": str(step.get("action") or "").strip(),
        "expected": expected_items,
    }


def _coerce_step_number(value: Any, index: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return index + 1


def _title_from_file_name(value: Any) -> str | None:
    text = _clean_text(value)
    if not text:
        return None

    without_extension = re.sub(r"\.docx$", "", text, flags=re.IGNORECASE)
    without_block_prefix = re.sub(r"^BB\d+[_\s-]*", "", without_extension, flags=re.IGNORECASE)
    return without_block_prefix.replace("_", " ").strip() or without_extension


def _strip_list_prefix(value: str) -> str:
    return re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", value).strip()


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    return text if text else None


def _clean_multiline_text(value: str) -> str | None:
    lines = [line.strip() for line in value.splitlines()]
    text = "\n".join(line for line in lines if line).strip()
    return text if text else None


def _normalize_line_breaks(value: Any) -> str:
    return str(value or "").replace("\r\n", "\n").replace("\r", "\n")
