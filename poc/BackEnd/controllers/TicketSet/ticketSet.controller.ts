import { Request, Response } from "express";
import {
  getAllTicketSets,
  getTicketSetById,
  createTicketSet,
  deleteTicketSet,
  updateTicketSetName,
} from "../../services/TicketSet/ticketSet.service";

export async function getAllTicketSetsController(_req: Request, res: Response): Promise<void> {
  try {
    const list = await getAllTicketSets();
    res.json(list.map((entry) => ({
      id: entry._id,
      name: entry.name,
      source_filename: entry.source_filename,
      source_type: entry.source_type,
      row_count: entry.row_count,
      created_at: entry.created_at,
    })));
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to fetch ticket sets." });
  }
}

export async function getTicketSetByIdController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const entry = await getTicketSetById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({
      id: entry._id,
      name: entry.name,
      source_filename: entry.source_filename,
      source_type: entry.source_type,
      row_count: entry.row_count,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to fetch ticket set." });
  }
}

export async function updateTicketSetNameController(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }
  try {
    const updated = await updateTicketSetName(req.params.id, name.trim());
    if (!updated) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: updated._id, name: updated.name, created_at: updated.created_at });
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to update ticket set." });
  }
}

export async function deleteTicketSetController(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const deleted = await deleteTicketSet(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json({ id: req.params.id });
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to delete ticket set." });
  }
}

export async function createTicketSetController(req: Request, res: Response): Promise<void> {
  const { name, rows, sourceFilename, sourceType } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }

  if (rows !== undefined && !Array.isArray(rows)) {
    res.status(400).json({ error: "rows must be an array when provided." });
    return;
  }

  try {
    const entry = await createTicketSet(name.trim(), rows ?? [], {
      sourceFilename,
      sourceType,
    });
    res.status(201).json({
      id: entry._id,
      name: entry.name,
      source_filename: entry.source_filename,
      source_type: entry.source_type,
      row_count: entry.row_count,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to save ticket set." });
  }
}
