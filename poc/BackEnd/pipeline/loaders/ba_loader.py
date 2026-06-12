"""Load BA rule tables from MongoDB for the pipeline.

The loader's job is intentionally small: fetch the persisted BAList document
and return it as plain Python data. It should not normalize, evaluate, or write
anything back to the database.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from bson import ObjectId
from pymongo import MongoClient


DEFAULT_MONGO_URI = "mongodb://localhost:27017/idemia"
BA_LIST_COLLECTION = "BALists"


class BAListNotFoundError(ValueError):
    """Raised when a BAList document cannot be found for the requested id."""


def _mongo_uri() -> str:
    return os.getenv("MONGO_URI", DEFAULT_MONGO_URI)


def _database_name(mongo_uri: str) -> str:
    database_name = mongo_uri.rsplit("/", 1)[-1].split("?", 1)[0].strip()
    return database_name or "idemia"


def _to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError(f"Invalid BAList id: {value}")

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


def _serialize_ba_list(document: dict[str, Any]) -> dict[str, Any]:
    rows = document.get("rows", [])
    columns = document.get("columns", [])

    return {
        "id": str(document["_id"]),
        "name": document.get("name", ""),
        "columns": columns if isinstance(columns, list) else [],
        "rows": rows if isinstance(rows, list) else [],
        "row_count": document.get("row_count", len(rows) if isinstance(rows, list) else 0),
        "created_at": _serialize_value(document.get("created_at")),
    }


def load_ba_list(ba_list_id: str) -> dict[str, Any]:
    """Load one BAList document by id."""

    mongo_uri = _mongo_uri()
    client = MongoClient(mongo_uri)

    try:
        db = client[_database_name(mongo_uri)]
        document = db[BA_LIST_COLLECTION].find_one({"_id": _to_object_id(ba_list_id)})

        if document is None:
            raise BAListNotFoundError(f"BAList not found: {ba_list_id}")

        return _serialize_ba_list(document)
    finally:
        client.close()


def load_ba_lists(ba_list_ids: list[str]) -> list[dict[str, Any]]:
    """Load multiple BAList documents in the same order as the requested ids."""

    return [load_ba_list(ba_list_id) for ba_list_id in ba_list_ids]
