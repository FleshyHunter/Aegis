import { Request, Response } from "express";
import {
  getAllBuildingBlocks,
  getBuildingBlockById,
  createBuildingBlock,
  deleteBuildingBlock,
  updateBuildingBlockName,
} from "../../services/BuildingBlock/buildingBlock.service";

export async function getAllBuildingBlocksController(_req: Request, res: Response): Promise<void> {
  try {
    const list = await getAllBuildingBlocks();
    res.json(list.map((entry) => ({
      id: entry._id,
      name: entry.name,
      created_at: entry.created_at,
    })));
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to fetch building blocks." });
  }
}

export async function getBuildingBlockByIdController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const entry = await getBuildingBlockById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({
      id: entry._id,
      name: entry.name,
      columns: entry.columns,
      rows: entry.rows,
      row_count: entry.row_count,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to fetch building block." });
  }
}

export async function updateBuildingBlockNameController(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }
  try {
    const updated = await updateBuildingBlockName(req.params.id, name.trim());
    if (!updated) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: updated._id, name: updated.name, created_at: updated.created_at });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to update building block." });
  }
}

export async function deleteBuildingBlockController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const deleted = await deleteBuildingBlock(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: req.params.id });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to delete building block." });
  }
}

export async function createBuildingBlockController(req: Request, res: Response): Promise<void> {
  const { name, rows } = req.body;
  if (!name || !Array.isArray(rows) || !rows.length) {
    res.status(400).json({ error: "name and rows are required." });
    return;
  }
  try {
    const entry = await createBuildingBlock(name, rows);
    res.status(201).json({
      id: entry._id,
      name: entry.name,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[buildingBlock]", err);
    res.status(500).json({ error: "Failed to save building block." });
  }
}
