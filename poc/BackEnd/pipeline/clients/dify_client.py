"""Client for Dify Workflow API calls."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from pipeline.config import DifyConfig


FORBIDDEN_PAYLOAD_KEYS = {"label_hint"}


class DifyClientError(RuntimeError):
    """Raised when Dify cannot return a usable response."""


class DifyClient:
    """Small HTTP client for Dify Workflow `/workflows/run`."""

    def __init__(self, config: DifyConfig | None = None) -> None:
        self.config = config or DifyConfig.from_env()

    def run_workflow(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Send a complete Dify workflow payload and return parsed JSON."""

        self._validate_payload(payload)
        request_payload = self._apply_payload_defaults(payload)
        return self._post_json("/workflows/run", request_payload)

    def run_workflow_outputs(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Run a workflow and return `data.outputs`."""

        response = self.run_workflow(payload)
        return extract_outputs(response)

    def _apply_payload_defaults(self, payload: dict[str, Any]) -> dict[str, Any]:
        request_payload = dict(payload)
        request_payload.setdefault("response_mode", self.config.response_mode)
        request_payload.setdefault("user", self.config.user)
        return request_payload

    def _validate_payload(self, payload: dict[str, Any]) -> None:
        if not isinstance(payload, dict):
            raise DifyClientError("Dify payload must be a JSON object.")

        if "inputs" not in payload or not isinstance(payload["inputs"], dict):
            raise DifyClientError("Dify payload must include an inputs object.")

        forbidden_key = _find_forbidden_key(payload)
        if forbidden_key:
            raise DifyClientError(f"Forbidden key in Dify payload: {forbidden_key}")

    def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.config.base_url}{path}"
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            },
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
            raise DifyClientError(
                f"Dify request failed with HTTP {exc.code}: {error_body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise DifyClientError(f"Could not connect to Dify endpoint: {exc}") from exc

        try:
            parsed = json.loads(response_body)
        except json.JSONDecodeError as exc:
            raise DifyClientError(f"Dify returned invalid JSON: {response_body}") from exc

        if not isinstance(parsed, dict):
            raise DifyClientError(f"Expected JSON object from Dify: {parsed}")

        return parsed


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
            currency_passed = ba_context.get("mapping_status") != "not_found" and ba_context.get("latest_rule") is not None
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
                            "currency_reasoning": "Mock currency response." if currency_passed else "Mock currency failure because no BA rule mapping was found.",
                            "stale_evidence": [] if currency_passed else ["No latest BA rule found for result_code."],
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


def extract_outputs(response: dict[str, Any]) -> dict[str, Any]:
    """Extract and validate the standard Dify `data.outputs` object."""

    try:
        outputs = response["data"]["outputs"]
    except (KeyError, TypeError) as exc:
        raise DifyClientError(f"Unexpected Dify response shape: {response}") from exc

    if not isinstance(outputs, dict):
        raise DifyClientError(f"Dify outputs must be an object: {outputs}")

    return outputs


def get_dify_client(*, use_mock: bool = False) -> DifyClient | MockDifyClient:
    if use_mock:
        return MockDifyClient()

    return DifyClient()


def _parse_json_string(value: Any, default: Any) -> Any:
    if not isinstance(value, str):
        return default

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def _find_forbidden_key(value: Any) -> str | None:
    if isinstance(value, dict):
        for key, item in value.items():
            if key in FORBIDDEN_PAYLOAD_KEYS:
                return key

            nested = _find_forbidden_key(item)
            if nested:
                return nested

    if isinstance(value, list):
        for item in value:
            nested = _find_forbidden_key(item)
            if nested:
                return nested

    return None
