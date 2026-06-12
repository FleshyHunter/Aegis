"""Load derived ticket test cases from MongoDB for the pipeline.

The pipeline should evaluate the derived test case table, not the raw uploaded
CSV. This loader fetches DerivedTestCases and returns plain Python data for the
next pipeline stage.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from bson import ObjectId
from pymongo import MongoClient


DEFAULT_MONGO_URI = "mongodb://localhost:27017/AEGIS"
DERIVED_TEST_CASE_COLLECTION = "DerivedTestCases"


class DerivedTestCaseNotFoundError(ValueError):
    """Raised when a DerivedTestCase document cannot be found."""


def _mongo_uri() -> str:
    return os.getenv("MONGO_URI", DEFAULT_MONGO_URI)


def _database_name(mongo_uri: str) -> str:
    database_name = mongo_uri.rsplit("/", 1)[-1].split("?", 1)[0].strip()
    return database_name or "AEGIS"


def _to_object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError(f"Invalid {label}: {value}")

    return ObjectId(value)


def _serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, list):
        return [_serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}

    return value


def _serialize_derived_test_case(document: dict[str, Any]) -> dict[str, Any]:
    rows = document.get("rows", [])
    columns = document.get("columns", [])

    return {
        "id": str(document["_id"]),
        "ticket_set_id": _serialize_value(document.get("ticket_set_id")),
        "raw_test_case_id": _serialize_value(document.get("raw_test_case_id")),
        "name": document.get("name", ""),
        "source_filename": document.get("source_filename", ""),
        "columns": columns if isinstance(columns, list) else [],
        "rows": rows if isinstance(rows, list) else [],
        "row_count": document.get("row_count", len(rows) if isinstance(rows, list) else 0),
        "created_at": _serialize_value(document.get("created_at")),
    }


def _find_one(filter_query: dict[str, Any]) -> dict[str, Any]:
    mongo_uri = _mongo_uri()
    client = MongoClient(mongo_uri)

    try:
        db = client[_database_name(mongo_uri)]
        document = db[DERIVED_TEST_CASE_COLLECTION].find_one(filter_query)

        if document is None:
            raise DerivedTestCaseNotFoundError("DerivedTestCase not found")

        return _serialize_derived_test_case(document)
    finally:
        client.close()


def load_derived_test_case(derived_test_case_id: str) -> dict[str, Any]:
    """Load one DerivedTestCase document by its own id."""

    return _find_one(
        {
            "_id": _to_object_id(
                derived_test_case_id,
                "DerivedTestCase id",
            )
        }
    )


def load_derived_test_case_by_ticket_set(ticket_set_id: str) -> dict[str, Any]:
    """Load the DerivedTestCase document linked to a TicketSet id."""

    return _find_one(
        {
            "ticket_set_id": _to_object_id(
                ticket_set_id,
                "TicketSet id",
            )
        }
    )


def load_tickets(ticket_set_id: str) -> dict[str, Any]:
    """Convenience alias for the main pipeline path."""

    return load_derived_test_case_by_ticket_set(ticket_set_id)
