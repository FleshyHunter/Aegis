"""Deterministic final verdict rules for pipeline results."""

from __future__ import annotations

from typing import Any, Literal


FinalClassification = Literal["Pass", "Failed", "Skipped"]


def combine_final_classification(evaluation: dict[str, Any] | None) -> FinalClassification:
    """Compute the final backend-owned classification from Phase 2 evidence."""

    if not evaluation or not evaluation.get("building_block_confirmed"):
        return "Skipped"

    if evaluation.get("frame_passed") is False or evaluation.get("currency_passed") is False:
        return "Failed"

    if evaluation.get("frame_passed") is True and evaluation.get("currency_passed") in {True, None}:
        return "Pass"

    return "Failed"


def build_final_reasoning(evaluation: dict[str, Any] | None) -> str:
    if not evaluation:
        return "No Building Block was confirmed for this test case."

    if not evaluation.get("building_block_confirmed"):
        return str(
            evaluation.get("building_block_confirmation_reasoning")
            or "Selected Building Block was not confirmed."
        )

    classification = combine_final_classification(evaluation)
    if classification == "Pass":
        if evaluation.get("currency_passed") is None:
            return "Frame conformance passed. BA rules were not provided, so requirement currency was not assessed."

        return "Frame conformance and requirement currency both passed."

    reasons = [
        value
        for value in [
            evaluation.get("frame_reasoning"),
            evaluation.get("currency_reasoning"),
        ]
        if value
    ]
    return " ".join(str(reason) for reason in reasons) or "Frame or currency evaluation failed."
