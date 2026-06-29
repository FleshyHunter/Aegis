"""Prompt builder for the QA consistency-checking POC."""

from __future__ import annotations

from typing import Any


SYSTEM_PROMPT = """You are a QA validation assistant.

Your job is to compare a source-of-truth QA requirement against a Jira test step.

Classify the Jira test step as exactly one of:
- MATCH
- PARTIAL MATCH
- MISMATCH

Use these definitions:
- MATCH: The Jira test step has the same meaning as the source of truth.
- PARTIAL MATCH: The Jira test step is related but missing details, has extra ambiguous wording, or only covers part of the source behavior.
- MISMATCH: The Jira test step contradicts the source of truth, validates the wrong behavior, or appears to be for a different case.

Return only valid JSON with this exact shape:
{
  "classification": "MATCH | PARTIAL MATCH | MISMATCH",
  "explanation": "Short explanation of why this classification was chosen."
}
"""


def build_validation_prompt(
    ba_truth_row: dict[str, Any],
    jira_test_step_row: dict[str, Any],
) -> str:
    """Create the user prompt for comparing one BA row against one Jira step."""

    return f"""Compare the source-of-truth requirement with the Jira test step.

Source of Truth: BA Spreadsheet Row
- Release: {field(ba_truth_row, "release")}
- Result Code: {field(ba_truth_row, "result_code")}
- Exception Label: {field(ba_truth_row, "exception_label")}
- Action: {field(ba_truth_row, "action")}
- Reason: {field(ba_truth_row, "reason")}
- Category: {field(ba_truth_row, "category")}
- Display ID: {field(ba_truth_row, "display_id")}
- Remarks: {field(ba_truth_row, "remarks")}

Validation Target: Jira Test Step
- Jira Ticket ID: {field(jira_test_step_row, "jira_ticket_id")}
- Test Case ID: {field(jira_test_step_row, "test_case_id")}
- Step ID: {field(jira_test_step_row, "step_id")}
- Action: {field(jira_test_step_row, "action")}
- Expected Result: {field(jira_test_step_row, "expectation")}
- Source Result Code: {field(jira_test_step_row, "source_result_code")}
- Category: {field(jira_test_step_row, "category")}
- Release: {field(jira_test_step_row, "release")}

Decision rules:
1. Focus mainly on whether the Jira Action and Expected Result are semantically consistent with the BA Action and Reason.
2. Use Result Code, Category, Release, and Exception Label as supporting context.
3. Do not require identical wording. Equivalent meaning is enough for MATCH.
4. If the Jira step adds unclear wording or only partially covers the BA row, choose PARTIAL MATCH.
5. If the Jira step contradicts the BA row or validates a different behavior, choose MISMATCH.

Return only the JSON object."""


def field(row: dict[str, Any], key: str) -> str:
    """Return a clean field value for prompt insertion."""

    value = row.get(key, "")
    if value is None:
        return ""
    return str(value).strip()
