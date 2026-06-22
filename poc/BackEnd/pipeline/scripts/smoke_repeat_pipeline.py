"""Repeat-run smoke test for the live pipeline.

This is intentionally separate from unit tests because it can call real Dify and
uses persisted Mongo data. Use it to check whether the pipeline is stable across
multiple runs without clicking through the UI.

Latest known-good run set, captured from Mongo:
- pipeline_run_id: 6a38b749f487253ce4eefb98
- run_status: completed
- created_at: 2026-06-22T04:17:13.373Z
- ticket_set_id: 6a38b749f487253ce4eefb95
- ticket_set_name: raw_test_cases copy.csv import
- ba_list_id: 6a2c22d80d976a9583531b10
- ba_list_name: BA_Rules_List.csv
- building_block_ids:
  - 6a2c2f4e0d976a9583531b4a: BB01_Passport_Scanning___Standard.docx
  - 6a2c2f510d976a9583531b4b: BB02_Iris_Capture_and_Verification.docx
  - 6a2c2f550d976a9583531b4c: BB03_Iris_Enrollment___First_Time_Traveller.docx

Equivalent command:
python3 pipeline/scripts/smoke_repeat_pipeline.py --runs 5 \
  --ticket-set-id 6a38b749f487253ce4eefb95 \
  --ba-list-id 6a2c22d80d976a9583531b10 \
  --building-block-ids 6a2c2f4e0d976a9583531b4a,6a2c2f510d976a9583531b4b,6a2c2f550d976a9583531b4c

Copy paste the command above to run this script, and vary fields for testing.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from bson import ObjectId
from pymongo import MongoClient


SCRIPT_PATH = Path(__file__).resolve()
BACKEND_DIR = SCRIPT_PATH.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from pipeline.run_pipeline import run_pipeline_from_env


DEFAULT_MONGO_URI = "mongodb://localhost:27017/AEGIS"


def main() -> None:
    args = parse_args()
    load_env_file(find_env_file())

    mongo_uri = os.getenv("MONGO_URI", DEFAULT_MONGO_URI)
    selected = resolve_inputs(
        mongo_uri=mongo_uri,
        ticket_set_id=args.ticket_set_id,
        building_block_ids=args.building_block_ids,
        ba_list_id=args.ba_list_id,
        with_latest_ba=args.with_latest_ba,
    )

    print("Pipeline smoke test inputs:")
    print(f"- ticket_set_id: {selected['ticket_set_id']}")
    print(f"- ba_list_id: {selected['ba_list_id'] or '(none)'}")
    print(f"- building_block_count: {len(selected['building_block_ids'])}")
    print(f"- mode: {'mock' if args.mock else 'real Dify'}")
    print(f"- runs: {args.runs}")

    attempts = 0
    failures = 0
    baseline_counts: dict[str, Any] | None = None
    started = time.time()
    log_dir = Path(args.log_dir).expanduser() if args.log_dir else None
    if log_dir:
        log_dir.mkdir(parents=True, exist_ok=True)

    for index in range(1, args.runs + 1):
        attempts += 1
        run_id = f"smoke-{int(started)}-{index}"
        apply_pipeline_env(
            pipeline_run_id=run_id,
            ticket_set_id=selected["ticket_set_id"],
            ba_list_id=selected["ba_list_id"],
            building_block_ids=selected["building_block_ids"],
            mock=args.mock,
            user_prompt=args.user_prompt,
            project_context_text=args.project_context_text,
        )

        print(f"\n[{index}/{args.runs}] Running {run_id}...")
        try:
            output = run_pipeline_from_env()
            if log_dir:
                write_run_log(log_dir=log_dir, run_id=run_id, output=output)

            counts = output.get("counts", {})
            summary = summarize_output(output)
            print("PASS", summary)

            if baseline_counts is None:
                baseline_counts = summary
            elif summary != baseline_counts:
                print("COUNT DRIFT: this run differs from the first successful run.")
                print(f"- baseline: {baseline_counts}")
                print(f"- current:  {summary}")
                print_ticket_results(output)
        except Exception as exc:
            failures += 1
            print(f"FAIL {type(exc).__name__}: {exc}")
            if not args.continue_on_fail:
                break

    passed = attempts - failures
    print(f"\nSmoke test complete: {passed}/{attempts} attempted runs passed, {failures} failed.")
    if failures:
        raise SystemExit(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Repeat-run the AEGIS pipeline.")
    parser.add_argument("--runs", type=int, default=5, help="Number of repeat runs.")
    parser.add_argument("--ticket-set-id", default="", help="TicketSet id to evaluate.")
    parser.add_argument(
        "--building-block-ids",
        default="",
        help="Comma-separated BuildingBlock ids. Defaults to all BuildingBlocks.",
    )
    parser.add_argument("--ba-list-id", default="", help="Optional BAList id.")
    parser.add_argument(
        "--with-latest-ba",
        action="store_true",
        help="Use the latest BAList when --ba-list-id is not provided.",
    )
    parser.add_argument("--mock", action="store_true", help="Use MockDifyClient.")
    parser.add_argument(
        "--continue-on-fail",
        action="store_true",
        help="Keep running after a failed attempt.",
    )
    parser.add_argument("--user-prompt", default="", help="Optional reviewer prompt.")
    parser.add_argument(
        "--project-context-text",
        default="",
        help="Optional project context text.",
    )
    parser.add_argument(
        "--log-dir",
        default="",
        help="Optional directory to write full JSON output for each run.",
    )
    return parser.parse_args()


def resolve_inputs(
    *,
    mongo_uri: str,
    ticket_set_id: str,
    building_block_ids: str,
    ba_list_id: str,
    with_latest_ba: bool,
) -> dict[str, Any]:
    client = MongoClient(mongo_uri)
    try:
        db = client[database_name(mongo_uri)]
        resolved_ticket_set_id = ticket_set_id.strip() or latest_ticket_set_id(db)
        resolved_building_block_ids = parse_csv(building_block_ids) or all_building_block_ids(db)
        resolved_ba_list_id = ba_list_id.strip()
        if not resolved_ba_list_id and with_latest_ba:
            resolved_ba_list_id = latest_ba_list_id(db)

        if not resolved_ticket_set_id:
            raise ValueError("No TicketSet found. Import a ticket CSV first or pass --ticket-set-id.")

        if not resolved_building_block_ids:
            raise ValueError("No BuildingBlocks found. Upload Building Blocks first or pass --building-block-ids.")

        return {
            "ticket_set_id": resolved_ticket_set_id,
            "building_block_ids": resolved_building_block_ids,
            "ba_list_id": resolved_ba_list_id,
        }
    finally:
        client.close()


def latest_ticket_set_id(db: Any) -> str:
    derived = db["DerivedTestCases"].find_one(
        {},
        {"ticket_set_id": 1},
        sort=[("created_at", -1), ("_id", -1)],
    )
    if derived and derived.get("ticket_set_id"):
        return str(derived["ticket_set_id"])

    ticket_set = db["TicketSets"].find_one(
        {},
        {"_id": 1},
        sort=[("created_at", -1), ("_id", -1)],
    )
    return str(ticket_set["_id"]) if ticket_set else ""


def all_building_block_ids(db: Any) -> list[str]:
    return [
        str(document["_id"])
        for document in db["BuildingBlocks"].find({}, {"_id": 1}).sort([("created_at", -1), ("_id", -1)])
    ]


def latest_ba_list_id(db: Any) -> str:
    ba_list = db["BALists"].find_one(
        {},
        {"_id": 1},
        sort=[("created_at", -1), ("_id", -1)],
    )
    return str(ba_list["_id"]) if ba_list else ""


def apply_pipeline_env(
    *,
    pipeline_run_id: str,
    ticket_set_id: str,
    ba_list_id: str,
    building_block_ids: list[str],
    mock: bool,
    user_prompt: str,
    project_context_text: str,
) -> None:
    os.environ["PIPELINE_RUN_ID"] = pipeline_run_id
    os.environ["TICKET_SET_ID"] = ticket_set_id
    os.environ["BA_LIST_ID"] = ba_list_id
    os.environ["BUILDING_BLOCK_IDS"] = ",".join(building_block_ids)
    os.environ["USER_PROMPT"] = user_prompt
    os.environ["PROJECT_CONTEXT_TEXT"] = project_context_text
    if mock:
        os.environ["USE_MOCK_LLM"] = "true"
    else:
        os.environ.pop("USE_MOCK_LLM", None)


def summarize_output(output: dict[str, Any]) -> dict[str, Any]:
    counts = output.get("counts", {})
    return {
        "ticket_count": output.get("ticket_count"),
        "passed": counts.get("passed_count"),
        "failed": counts.get("failed_count"),
        "skipped": counts.get("skipped_count"),
    }


def print_ticket_results(output: dict[str, Any]) -> None:
    print("Per-ticket results:")
    for result in output.get("results", []):
        selected_bb = result.get("selected_building_block") or {}
        print(
            "-",
            {
                "jira_ticket_id": result.get("jira_ticket_id"),
                "test_case_id": result.get("test_case_id"),
                "result_code": result.get("result_code"),
                "classification": result.get("final_classification"),
                "building_block": selected_bb.get("block_id") or selected_bb.get("title"),
                "reasoning": result.get("final_reasoning"),
            },
        )


def write_run_log(*, log_dir: Path, run_id: str, output: dict[str, Any]) -> None:
    path = log_dir / f"{run_id}.json"
    path.write_text(json.dumps(output, ensure_ascii=True, indent=2, sort_keys=True))
    print(f"Wrote run log: {path}")


def database_name(mongo_uri: str) -> str:
    name = mongo_uri.rsplit("/", 1)[-1].split("?", 1)[0].strip()
    return name or "AEGIS"


def parse_csv(value: str) -> list[str]:
    ids = [item.strip() for item in value.split(",") if item.strip()]
    invalid = [item for item in ids if not ObjectId.is_valid(item)]
    if invalid:
        raise ValueError(f"Invalid ObjectId values: {', '.join(invalid)}")
    return ids


def find_env_file() -> Path | None:
    for parent in [SCRIPT_PATH.parent, *SCRIPT_PATH.parents]:
        candidate = parent / ".env"
        if candidate.exists():
            return candidate
    return None


def load_env_file(path: Path | None) -> None:
    if not path:
        return

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


if __name__ == "__main__":
    main()
