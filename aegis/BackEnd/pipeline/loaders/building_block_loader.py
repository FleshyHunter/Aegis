"""Load Building Block documents from MongoDB for the pipeline.

The loader fetches persisted BuildingBlock entries and returns plain Python
data. By default it loads the extracted DOCX preview text and metadata, not the
raw file bytes.
"""

from __future__ import annotations

import base64
import os
from datetime import datetime
from typing import Any

from bson import ObjectId
from bson.binary import Binary
from pymongo import MongoClient


DEFAULT_MONGO_URI = "mongodb://localhost:27017/AEGIS"
BUILDING_BLOCK_COLLECTION = "BuildingBlocks"


class BuildingBlockNotFoundError(ValueError):
    """Raised when a BuildingBlock document cannot be found for the requested id."""


def _mongo_uri() -> str:
    return os.getenv("MONGO_URI", DEFAULT_MONGO_URI)


def _database_name(mongo_uri: str) -> str:
    database_name = mongo_uri.rsplit("/", 1)[-1].split("?", 1)[0].strip()
    return database_name or "AEGIS"


def _to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError(f"Invalid BuildingBlock id: {value}")

    return ObjectId(value)


def _serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, (bytes, bytearray, Binary)):
        return base64.b64encode(bytes(value)).decode("ascii")

    if isinstance(value, list):
        return [_serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}

    return value


def _serialize_building_block(document: dict[str, Any]) -> dict[str, Any]:
    output = {
        "id": str(document["_id"]),
        "name": document.get("name", ""),
        "file_name": document.get("file_name", ""),
        "source_type": document.get("source_type", "docx"),
        "mime_type": document.get("mime_type", ""),
        "size_bytes": document.get("size_bytes", 0),
        "preview_text": document.get("preview_text", ""),
        "preview_status": document.get("preview_status", ""),
        "preview_error": document.get("preview_error", ""),
        "created_at": _serialize_value(document.get("created_at")),
    }

    if "file_data" in document:
        output["file_data_base64"] = _serialize_value(document.get("file_data"))

    return output


def load_building_block(
    building_block_id: str,
    *,
    include_file_data: bool = False,
) -> dict[str, Any]:
    """Load one BuildingBlock document by id."""

    mongo_uri = _mongo_uri()
    client = MongoClient(mongo_uri)
    projection = None if include_file_data else {"file_data": 0}

    try:
        db = client[_database_name(mongo_uri)]
        document = db[BUILDING_BLOCK_COLLECTION].find_one(
            {"_id": _to_object_id(building_block_id)},
            projection,
        )

        if document is None:
            raise BuildingBlockNotFoundError(
                f"BuildingBlock not found: {building_block_id}"
            )

        return _serialize_building_block(document)
    finally:
        client.close()


def load_building_blocks(
    building_block_ids: list[str],
    *,
    include_file_data: bool = False,
) -> list[dict[str, Any]]:
    """Load multiple BuildingBlock documents in the same order as requested ids."""

    return [
        load_building_block(
            building_block_id,
            include_file_data=include_file_data,
        )
        for building_block_id in building_block_ids
    ]
