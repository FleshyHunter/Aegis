import { Request, Response } from "express";
import {
  getAllBALists,
  getBAListById,
  createBAList,
  deleteBAList,
  updateBAListName,
} from "../../services/BaList/baList.service";

export async function getAllBAListsController(_req: Request, res: Response): Promise<void> {
  try {
    const list = await getAllBALists();
    res.json(list.map((entry) => ({
      id: entry._id,
      name: entry.name,
      created_at: entry.created_at,
    })));
  } catch (err) {
    console.error("[baList]", err);
    res.status(500).json({ error: "Failed to fetch BA lists." });
  }
}

export async function getBAListByIdController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const entry = await getBAListById(req.params.id);
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
    console.error("[baList]", err);
    res.status(500).json({ error: "Failed to fetch BA list." });
  }
}

export async function updateBAListNameController(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }
  try {
    const updated = await updateBAListName(req.params.id, name.trim());
    if (!updated) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: updated._id, name: updated.name, created_at: updated.created_at });
  } catch (err) {
    console.error("[baList]", err);
    res.status(500).json({ error: "Failed to update BA list." });
  }
}

export async function deleteBAListController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const deleted = await deleteBAList(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: req.params.id });
  } catch (err) {
    console.error("[baList]", err);
    res.status(500).json({ error: "Failed to delete BA list." });
  }
}

export async function createBAListController(req: Request, res: Response): Promise<void> {
  const { name, rows } = req.body;
  if (!name || !Array.isArray(rows) || !rows.length) {
    res.status(400).json({ error: "name and rows are required." });
    return;
  }
  try {
    const entry = await createBAList(name, rows);
    res.status(201).json({
      id: entry._id,
      name: entry.name,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[baList]", err);
    res.status(500).json({ error: "Failed to save BA list." });
  }
}
