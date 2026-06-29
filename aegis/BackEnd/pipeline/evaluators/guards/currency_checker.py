"""Local guardrails for Dify requirement-currency responses.

This module does not decide semantic currency by itself. Dify compares the test
case to BA content. The guard enforces deterministic backend facts such as BA
mapping existence and result-code alignment.
"""

from __future__ import annotations

import copy
from typing import Any


def guard_currency_evaluation(
    *,
    evaluation: dict[str, Any],
    ticket: dict[str, Any],
    ba_context: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    """Return a checked evaluation copy and currency guard notes."""

    checked = copy.deepcopy(evaluation)
    notes: list[str] = []

    if not checked.get("building_block_confirmed"):
        if checked.get("currency_passed") is not None:
            checked["currency_passed"] = None
            notes.append("Currency result cleared because the Building Block was not confirmed.")

        if checked.get("currency_reasoning") is not None:
            checked["currency_reasoning"] = None
            notes.append("Currency reasoning cleared because the Building Block was not confirmed.")

        if checked.get("stale_evidence"):
            checked["stale_evidence"] = []
            notes.append("Stale evidence cleared because the Building Block was not confirmed.")

        return checked, notes

    stale_evidence = _string_list(checked.get("stale_evidence"))
    checked["stale_evidence"] = stale_evidence

    latest_rule = ba_context.get("latest_rule")
    mapping_status = ba_context.get("mapping_status")
    ticket_result_code = _normalize_code(ticket.get("result_code"))
    ba_context_result_code = _normalize_code(ba_context.get("result_code"))
    latest_rule_result_code = _normalize_code(latest_rule.get("result_code")) if isinstance(latest_rule, dict) else None

    if mapping_status == "unavailable" or ba_context.get("currency_required") is False:
        checked["currency_passed"] = None
        checked["currency_reasoning"] = (
            "BA rules were not provided; requirement currency was not assessed."
        )
        checked["stale_evidence"] = []
        notes.append("Currency not assessed because BA rules were not provided.")
        return checked, notes

    if mapping_status != "found" or not isinstance(latest_rule, dict):
        _force_currency_failure(
            checked,
            stale_evidence,
            f"No latest BA rule found for result_code {ticket_result_code or 'unknown'}.",
        )
        notes.append("Currency failed because BA mapping was not found.")
        return checked, notes

    if ticket_result_code and latest_rule_result_code and ticket_result_code != latest_rule_result_code:
        _force_currency_failure(
            checked,
            stale_evidence,
            (
                "Ticket result_code "
                f"{ticket_result_code} does not match latest BA rule result_code {latest_rule_result_code}."
            ),
        )
        notes.append("Currency failed because ticket result_code did not match latest BA rule result_code.")

    if ticket_result_code and ba_context_result_code and ticket_result_code != ba_context_result_code:
        _force_currency_failure(
            checked,
            stale_evidence,
            (
                "Ticket result_code "
                f"{ticket_result_code} does not match BA context result_code {ba_context_result_code}."
            ),
        )
        notes.append("Currency failed because ticket result_code did not match BA context result_code.")

    if checked.get("currency_passed") is True and stale_evidence:
        checked["currency_passed"] = False
        checked["currency_reasoning"] = _append_reason(
            checked.get("currency_reasoning"),
            "Backend guard changed currency_passed to false because stale evidence was listed.",
        )
        notes.append("currency_passed was true while stale_evidence was non-empty.")

    if checked.get("currency_passed") is False and not stale_evidence:
        checked["stale_evidence"] = [
            "Currency failed but Dify did not provide stale evidence."
        ]
        checked["currency_reasoning"] = _append_reason(
            checked.get("currency_reasoning"),
            "Backend guard added stale evidence because currency_passed was false.",
        )
        notes.append("currency_passed was false while stale_evidence was empty.")

    return checked, notes


def _force_currency_failure(
    evaluation: dict[str, Any],
    stale_evidence: list[str],
    evidence: str,
) -> None:
    evaluation["currency_passed"] = False

    if evidence not in stale_evidence:
        stale_evidence.append(evidence)

    evaluation["stale_evidence"] = stale_evidence
    evaluation["currency_reasoning"] = _append_reason(evaluation.get("currency_reasoning"), evidence)


def _normalize_code(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip().upper()
    return text or None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _append_reason(existing: Any, addition: str) -> str:
    existing_text = str(existing).strip() if existing else ""
    if not existing_text:
        return addition

    if addition in existing_text:
        return existing_text

    return f"{existing_text} {addition}"
