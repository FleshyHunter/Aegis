"""Helpers for selecting Building Blocks from Phase 1 routing output."""

from __future__ import annotations

from typing import Any


def find_building_block_for_candidate(
    candidate: dict[str, Any],
    building_blocks: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """Find a normalized Building Block using Dify's selected candidate identifiers."""

    candidate_building_block_id = _clean(candidate.get("building_block_id"))
    candidate_block_id = _clean(candidate.get("block_id"))

    for building_block in building_blocks:
        if candidate_building_block_id and _clean(building_block.get("building_block_id")) == candidate_building_block_id:
            return building_block

        if candidate_block_id and _clean(building_block.get("block_id")) == candidate_block_id:
            return building_block

    return None


def select_candidate_building_blocks(
    routing_response: dict[str, Any],
    building_blocks: list[dict[str, Any]],
    *,
    limit: int = 2,
) -> list[dict[str, Any]]:
    """Resolve top routing candidates into full normalized Building Block objects."""

    selected: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for candidate in routing_response.get("top_candidates", []):
        if not isinstance(candidate, dict):
            continue

        building_block = find_building_block_for_candidate(candidate, building_blocks)
        if not building_block:
            continue

        stable_id = str(building_block.get("building_block_id") or building_block.get("block_id") or "")
        if stable_id in seen_ids:
            continue

        selected.append(building_block)
        seen_ids.add(stable_id)

        if len(selected) >= limit:
            break

    return selected


def _clean(value: Any) -> str:
    return str(value or "").strip()
