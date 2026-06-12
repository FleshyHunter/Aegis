"""LLM client for the QA consistency-checking POC — Dify Workflow edition."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


DEFAULT_TIMEOUT_SECONDS = 60


class LLMClientError(RuntimeError):
    """Raised when the configured LLM endpoint cannot return a usable result."""


@dataclass(frozen=True)
class LLMConfig:
    """Runtime configuration for a Dify Workflow endpoint."""

    base_url: str
    api_key: str
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS

    @classmethod
    def from_env(cls) -> "LLMConfig":
        base_url = os.getenv("LLM_BASE_URL", "").strip()
        api_key = os.getenv("LLM_API_KEY", "").strip()

        if not base_url:
            raise LLMClientError("Missing LLM_BASE_URL environment variable.")
        if not api_key:
            raise LLMClientError("Missing LLM_API_KEY environment variable.")

        timeout_seconds = int(os.getenv("LLM_TIMEOUT", DEFAULT_TIMEOUT_SECONDS))

        return cls(
            base_url=base_url.rstrip("/"),
            api_key=api_key,
            timeout_seconds=timeout_seconds,
        )


class LLMClient:
    """Client for Dify Workflow API."""

    def __init__(self, config: LLMConfig | None = None) -> None:
        self.config = config or LLMConfig.from_env()

    def complete(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        """Send a prompt to the Dify workflow and return the text output."""

        payload: dict[str, Any] = {
            "inputs": {"query": prompt},
            "response_mode": "blocking",
            "user": "aegis-poc",
        }

        response = self._post_json("/workflows/run", payload)

        try:
            content = response["data"]["outputs"]["text"]
        except (KeyError, TypeError) as exc:
            raise LLMClientError(f"Unexpected Dify response shape: {response}") from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMClientError("Dify returned an empty response.")

        return content.strip()

    def complete_json(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        """Send a prompt and parse the response as JSON."""

        raw_response = self.complete(prompt, system_prompt=system_prompt)

        # Strip markdown code blocks if Dify wraps the response
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0].strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise LLMClientError(f"Dify response was not valid JSON: {raw_response}") from exc

        if not isinstance(parsed, dict):
            raise LLMClientError(f"Expected a JSON object, got: {parsed}")

        return parsed

    def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.config.base_url}{path}"
        body = json.dumps(payload).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.config.api_key}",
        }

        request = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=self.config.timeout_seconds,
            ) as response:
                response_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise LLMClientError(
                f"Dify request failed with HTTP {exc.code}: {error_body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise LLMClientError(f"Could not connect to Dify endpoint: {exc}") from exc

        try:
            parsed = json.loads(response_body)
        except json.JSONDecodeError as exc:
            raise LLMClientError(f"Dify returned invalid JSON: {response_body}") from exc

        if not isinstance(parsed, dict):
            raise LLMClientError(f"Expected JSON object from Dify: {parsed}")

        return parsed


class MockLLMClient:
    """Deterministic local client for smoke-testing the POC without a live LLM."""

    def complete(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        lowered = prompt.lower()

        if "but system behaves differently" in lowered or "modified step" in lowered:
            result = {
                "classification": "MISMATCH",
                "explanation": "The test step changes or contradicts the source behavior.",
            }
        else:
            result = {
                "classification": "MATCH",
                "explanation": "The test step appears consistent with the source behavior.",
            }

        return json.dumps(result)

    def complete_json(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        return json.loads(self.complete(prompt))


def get_llm_client() -> LLMClient | MockLLMClient:
    """Return a real Dify client or mock based on USE_MOCK_LLM env var."""

    use_mock = os.getenv("USE_MOCK_LLM", "").strip().lower()
    if use_mock in {"1", "true", "yes", "y"}:
        return MockLLMClient()

    return LLMClient()
