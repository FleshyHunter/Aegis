"""Run the QA consistency-checking POC.

Usage:
    USE_MOCK_LLM=true python3 aegis/run_poc.py

For a real OpenAI-compatible endpoint, set:
    LLM_BASE_URL=http://your-endpoint/v1
    LLM_API_KEY=your-token-if-needed
    LLM_MODEL=your-model-name
    python3 aegis/run_poc.py
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any

from llm_client import LLMClientError, get_llm_client
from prompt import SYSTEM_PROMPT, build_validation_prompt


PROJECT_DIR = Path(__file__).resolve().parent
DATA_DIR = PROJECT_DIR.parent / "database"

BA_TRUTH_PATH = Path(os.getenv("BA_TRUTH_PATH", str(DATA_DIR / "ba_truth_dataset.csv")))
JIRA_STEPS_PATH = Path(os.getenv("JIRA_STEPS_PATH", str(DATA_DIR / "jira_teststep_dataset.csv")))
OUTPUT_PATH = Path(os.getenv("OUTPUT_PATH", str(PROJECT_DIR.parent / "database" / "poc_results.csv")))

VALID_CLASSIFICATIONS = {"MATCH", "MISMATCH"}


def main() -> None:
    ba_rows = read_csv(BA_TRUTH_PATH)
    jira_rows = read_csv(JIRA_STEPS_PATH)
    ba_by_result_code = index_by(ba_rows, "result_code")
    llm_client = get_llm_client()

    results: list[dict[str, Any]] = []

    for jira_row in jira_rows:
        source_result_code = clean(jira_row.get("source_result_code"))
        ba_row = ba_by_result_code.get(source_result_code)

        if not ba_row:
            result = {
                "classification": "MISMATCH",
                "explanation": (
                    f"No BA source-of-truth row found for result code "
                    f"{source_result_code}."
                ),
            }
        else:
            result = validate_step(llm_client, ba_row, jira_row)

        output_row = build_output_row(jira_row, ba_row, result)
        results.append(output_row)
        print_result(output_row)

    write_csv(OUTPUT_PATH, results)
    print(f"\nSaved results to: {OUTPUT_PATH}")


def validate_step(
    llm_client: Any,
    ba_row: dict[str, Any],
    jira_row: dict[str, Any],
) -> dict[str, str]:
    prompt_text = build_validation_prompt(ba_row, jira_row)

    try:
        response = llm_client.complete_json(
            prompt_text,
            system_prompt=SYSTEM_PROMPT,
        )
    except LLMClientError as exc:
        return {
            "classification": "MISMATCH",
            "explanation": f"LLM call failed: {exc}",
        }

    classification = clean(response.get("classification")).upper()
    explanation = clean(response.get("explanation"))

    if classification not in VALID_CLASSIFICATIONS:
        return {
            "classification": "MISMATCH",
            "explanation": (
                "LLM returned an invalid classification. Raw response: "
                f"{json.dumps(response, ensure_ascii=True)}"
            ),
        }

    return {
        "classification": classification,
        "explanation": explanation,
    }


def build_output_row(
    jira_row: dict[str, Any],
    ba_row: dict[str, Any] | None,
    result: dict[str, str],
) -> dict[str, str]:
    return {
        "jira_ticket_id": clean(jira_row.get("jira_ticket_id")),
        "test_case_id": clean(jira_row.get("test_case_id")),
        "step_id": clean(jira_row.get("step_id")),
        "source_result_code": clean(jira_row.get("source_result_code")),
        "ba_action": clean(ba_row.get("action")) if ba_row else "",
        "ba_reason": clean(ba_row.get("reason")) if ba_row else "",
        "jira_action": clean(jira_row.get("action")),
        "jira_expectation": clean(jira_row.get("expectation")),
        "classification": result["classification"],
        "explanation": result["explanation"],
        "label_hint": clean(jira_row.get("label_hint")),
    }


def print_result(row: dict[str, str]) -> None:
    print(
        "[{classification}] {jira_ticket_id} / {step_id} / {source_result_code}: "
        "{explanation}".format(**row)
    )


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if not rows:
        return

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def index_by(rows: list[dict[str, str]], key: str) -> dict[str, dict[str, str]]:
    return {clean(row.get(key)): row for row in rows}


def clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


if __name__ == "__main__":
    main()
