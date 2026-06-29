"""Runtime configuration for the Python pipeline."""

from __future__ import annotations

import os
from dataclasses import dataclass


DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1"
DEFAULT_DIFY_TIMEOUT_SECONDS = 60
DEFAULT_DIFY_RESPONSE_MODE = "blocking"
DEFAULT_DIFY_USER = "aegis"


class PipelineConfigError(RuntimeError):
    """Raised when required pipeline runtime configuration is missing."""


@dataclass(frozen=True)
class DifyConfig:
    base_url: str
    api_key: str
    timeout_seconds: int = DEFAULT_DIFY_TIMEOUT_SECONDS
    response_mode: str = DEFAULT_DIFY_RESPONSE_MODE
    user: str = DEFAULT_DIFY_USER

    @classmethod
    def from_env(
        cls,
        *,
        api_key_env: str = "DIFY_API_KEY",
        fallback_api_key_env: str = "LLM_API_KEY",
    ) -> "DifyConfig":
        base_url = (
            os.getenv("DIFY_BASE_URL")
            or os.getenv("LLM_BASE_URL")
            or DEFAULT_DIFY_BASE_URL
        ).strip()
        api_key = (
            os.getenv(api_key_env)
            or os.getenv("DIFY_API_KEY")
            or os.getenv(fallback_api_key_env)
            or ""
        ).strip()

        if not api_key:
            raise PipelineConfigError(
                f"Missing {api_key_env}, DIFY_API_KEY, or {fallback_api_key_env} environment variable."
            )

        timeout_seconds = _read_int_env(
            "DIFY_TIMEOUT_SECONDS",
            fallback_key="LLM_TIMEOUT",
            default=DEFAULT_DIFY_TIMEOUT_SECONDS,
        )
        response_mode = (
            os.getenv("DIFY_RESPONSE_MODE")
            or DEFAULT_DIFY_RESPONSE_MODE
        ).strip()
        user = (os.getenv("DIFY_USER") or DEFAULT_DIFY_USER).strip()

        return cls(
            base_url=base_url.rstrip("/"),
            api_key=api_key,
            timeout_seconds=timeout_seconds,
            response_mode=response_mode,
            user=user,
        )


def _read_int_env(key: str, *, fallback_key: str, default: int) -> int:
    raw_value = os.getenv(key) or os.getenv(fallback_key)
    if raw_value is None or not raw_value.strip():
        return default

    try:
        return int(raw_value)
    except ValueError as exc:
        raise PipelineConfigError(f"{key} must be an integer.") from exc
