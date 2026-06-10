"""Temporary pipeline entrypoint.

This file replaces the old run_poc.py entrypoint. For now it only proves that
the new pipeline can be started from the backend after import-side DB writes.
"""

import json
import os


def main() -> None:
    payload = {
        "status": "started",
        "ticket_set_id": os.getenv("TICKET_SET_ID", ""),
        "ba_list_id": os.getenv("BA_LIST_ID", ""),
        "building_block_ids": [
            value for value in os.getenv("BUILDING_BLOCK_IDS", "").split(",") if value
        ],
        "has_user_prompt": bool(os.getenv("USER_PROMPT", "").strip()),
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
