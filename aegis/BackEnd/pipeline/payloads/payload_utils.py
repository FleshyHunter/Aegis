"""Shared helpers for Dify payload construction."""

from __future__ import annotations

import copy
import json
from typing import Any


FORBIDDEN_KEYS = {"label_hint"}
DEFAULT_RESPONSE_MODE = "blocking"
DEFAULT_DIFY_USER = "aegis"


def strip_forbidden_keys(value: Any) -> Any:
    """Return a deep copy with answer-key fields removed recursively."""

    copied = copy.deepcopy(value)
    return _remove_keys(copied, FORBIDDEN_KEYS)


def json_for_dify(value: Any) -> str:
    """Serialize payload values into stable compact JSON strings for Dify."""

    return json.dumps(
        strip_forbidden_keys(value),
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    )


def build_dify_envelope(
    *,
    inputs: dict[str, Any],
    response_mode: str = DEFAULT_RESPONSE_MODE,
    user: str = DEFAULT_DIFY_USER,
) -> dict[str, Any]:
    """Build the common Dify Workflow request envelope."""

    return {
        "inputs": strip_forbidden_keys(inputs),
        "response_mode": response_mode,
        "user": user,
    }


def build_ba_context_for_ticket(
    *,
    normalized_ba: dict[str, Any],
    result_code: str | None,
) -> dict[str, Any]:
    """Select latest and historical BA rows for one ticket result code."""

    normalized_code = result_code.strip().upper() if result_code else None
    if normalized_ba.get("ba_available") is False:
        return {
            "result_code": normalized_code,
            "latest_rule": None,
            "historical_rules": [],
            "mapping_status": "unavailable",
            "currency_required": False,
        }

    if not result_code:
        return {
            "result_code": None,
            "latest_rule": None,
            "historical_rules": [],
            "mapping_status": "not_found",
            "currency_required": True,
        }

    rules = normalized_ba.get("rules_by_result_code", {}).get(normalized_code, [])
    latest_rule = normalized_ba.get("latest_by_result_code", {}).get(normalized_code)

    return {
        "result_code": normalized_code,
        "latest_rule": latest_rule,
        "historical_rules": rules,
        "mapping_status": "found" if latest_rule else "not_found",
        "currency_required": True,
    }


def _remove_keys(value: Any, forbidden_keys: set[str]) -> Any:
    if isinstance(value, dict):
        return {
            key: _remove_keys(item, forbidden_keys)
            for key, item in value.items()
            if key not in forbidden_keys
        }

    if isinstance(value, list):
        return [_remove_keys(item, forbidden_keys) for item in value]

    return value
