"""Shared AI response schema validation helpers."""

from __future__ import annotations

from typing import Any


class PipelineResponseValidationError(ValueError):
    """Raised when an AI workflow response does not match the expected contract."""


def required_string(value: dict[str, Any], field: str) -> str:
    field_value = value.get(field)
    if not isinstance(field_value, str):
        raise PipelineResponseValidationError(f"{field} must be a string.")

    return field_value


def optional_string(value: dict[str, Any], field: str) -> str | None:
    field_value = value.get(field)
    if field_value is None:
        return None

    if not isinstance(field_value, str):
        raise PipelineResponseValidationError(f"{field} must be a string or null.")

    return field_value


def required_bool(value: dict[str, Any], field: str) -> bool:
    field_value = value.get(field)
    if not isinstance(field_value, bool):
        coerced = coerce_bool_string(field_value)
        if coerced is None:
            raise PipelineResponseValidationError(f"{field} must be a boolean.")

        return coerced

    return field_value


def optional_bool(value: dict[str, Any], field: str) -> bool | None:
    field_value = value.get(field)
    if field_value is None:
        return None

    if not isinstance(field_value, bool):
        coerced = coerce_bool_string(field_value)
        if coerced is None:
            raise PipelineResponseValidationError(f"{field} must be a boolean or null.")

        return coerced

    return field_value


def coerce_bool_string(value: Any) -> bool | None:
    if not isinstance(value, str):
        return None

    normalized = value.strip().lower()
    if normalized == "true":
        return True

    if normalized == "false":
        return False

    return None


def string_list(value: dict[str, Any], field: str) -> list[str]:
    field_value = value.get(field)
    if not isinstance(field_value, list):
        raise PipelineResponseValidationError(f"{field} must be a list.")

    if not all(isinstance(item, str) for item in field_value):
        raise PipelineResponseValidationError(f"{field} must contain only strings.")

    return field_value
