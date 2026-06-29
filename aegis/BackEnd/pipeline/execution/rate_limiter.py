"""Shared throttling for outbound Dify workflow calls."""

from __future__ import annotations

import threading
import time
from typing import Any, Protocol


class WorkflowClient(Protocol):
    def run_workflow_outputs(self, payload: dict[str, Any]) -> dict[str, Any]:
        ...


class DifyRateLimiter:
    """Thread-safe minimum-interval limiter for outbound Dify requests."""

    def __init__(self, *, rpm: int, enabled: bool = True) -> None:
        self.enabled = enabled
        self.min_interval_seconds = 60.0 / max(1, rpm)
        self._lock = threading.Lock()
        self._last_request_at = 0.0

    def run(
        self,
        client: WorkflowClient,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        self.wait()
        return client.run_workflow_outputs(payload)

    def wait(self) -> None:
        if not self.enabled:
            return

        with self._lock:
            now = time.monotonic()
            wait_seconds = self.min_interval_seconds - (now - self._last_request_at)
            if wait_seconds > 0:
                time.sleep(wait_seconds)

            self._last_request_at = time.monotonic()
