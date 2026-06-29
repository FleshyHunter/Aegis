"""AI service wrapper for frame/currency evaluation calls."""

from __future__ import annotations

from typing import Any


class EvaluationAIService:
    """Evaluate AI payloads through the configured client and rate limiter."""

    def __init__(self, ai_client: Any, rate_limiter: Any) -> None:
        self.ai_client = ai_client
        self.rate_limiter = rate_limiter

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.rate_limiter.run(self.ai_client, payload)
