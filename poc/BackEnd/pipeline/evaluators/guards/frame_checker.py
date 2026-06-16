"""Local guardrails for Dify frame-conformance responses.

This module does not perform semantic step matching. Dify owns that judgement.
The guard only catches impossible or weakly evidenced frame responses before the
backend computes the final verdict.
"""

from __future__ import annotations

import copy
from typing import Any


def guard_frame_evaluation(evaluation: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Return a checked evaluation copy and frame guard notes.

    The guard enforces local consistency:
    - passed frame cannot list missing canonical steps
    - failed frame should include missing-step evidence
    - unconfirmed BB responses must not carry frame findings
    """

    checked = copy.deepcopy(evaluation)
    notes: list[str] = []

    if not checked.get("building_block_confirmed"):
        if checked.get("frame_passed") is not None:
            checked["frame_passed"] = None
            notes.append("Frame result cleared because the Building Block was not confirmed.")

        if checked.get("frame_reasoning") is not None:
            checked["frame_reasoning"] = None
            notes.append("Frame reasoning cleared because the Building Block was not confirmed.")

        if checked.get("missing_canonical_steps"):
            checked["missing_canonical_steps"] = []
            notes.append("Missing canonical steps cleared because the Building Block was not confirmed.")

        return checked, notes

    frame_passed = checked.get("frame_passed")
    missing_steps = _string_list(checked.get("missing_canonical_steps"))
    checked["missing_canonical_steps"] = missing_steps

    if frame_passed is True and missing_steps:
        checked["frame_passed"] = False
        checked["frame_reasoning"] = _append_reason(
            checked.get("frame_reasoning"),
            "Backend guard changed frame_passed to false because missing canonical steps were listed.",
        )
        notes.append("frame_passed was true while missing_canonical_steps was non-empty.")

    if frame_passed is False and not missing_steps:
        checked["missing_canonical_steps"] = [
            "Frame failed but Dify did not provide missing canonical step evidence."
        ]
        checked["frame_reasoning"] = _append_reason(
            checked.get("frame_reasoning"),
            "Backend guard added missing-step evidence because frame_passed was false.",
        )
        notes.append("frame_passed was false while missing_canonical_steps was empty.")

    return checked, notes


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _append_reason(existing: Any, addition: str) -> str:
    existing_text = str(existing).strip() if existing else ""
    if not existing_text:
        return addition

    return f"{existing_text} {addition}"
