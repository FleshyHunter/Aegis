"""Helpers for unwrapping Dify workflow response payloads."""

from __future__ import annotations

import json
from typing import Any


def extract_result(outputs: dict[str, Any]) -> Any:
    candidate = outputs["result"] if "result" in outputs else outputs
    return unwrap_dify_result(candidate)


def unwrap_dify_result(value: Any) -> Any:
    """Return the inner structured object from common Dify output wrappers."""

    if isinstance(value, str):
        try:
            return unwrap_dify_result(json.loads(value))
        except json.JSONDecodeError:
            return value

    if not isinstance(value, dict):
        return value

    if looks_like_pipeline_response(value):
        return value

    for key in ("structured_output", "result", "output", "outputs"):
        nested = value.get(key)
        if nested is not None and nested is not value:
            unwrapped = unwrap_dify_result(nested)
            if looks_like_pipeline_response(unwrapped):
                return unwrapped

    return value


def looks_like_pipeline_response(value: Any) -> bool:
    if not isinstance(value, dict):
        return False

    return "top_candidates" in value or "building_block_confirmed" in value
