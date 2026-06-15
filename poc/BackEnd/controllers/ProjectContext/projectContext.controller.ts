import { Request, Response } from "express";
import {
  createProjectContext,
  deleteProjectContext,
  getAllProjectContexts,
  getProjectContextById,
  updateProjectContext,
} from "../../services/ProjectContext/projectContext.service";

export async function getAllProjectContextsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const list = await getAllProjectContexts();
    res.json(list.map(toProjectContextResponse));
  } catch (err) {
    console.error("[projectContext]", err);
    res.status(500).json({ error: "Failed to fetch project contexts." });
  }
}

export async function getProjectContextByIdController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const entry = await getProjectContextById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: "Not found." });
      return;
    }

    res.json(toProjectContextResponse(entry));
  } catch (err) {
    console.error("[projectContext]", err);
    res.status(500).json({ error: "Failed to fetch project context." });
  }
}

export async function createProjectContextController(
  req: Request,
  res: Response
): Promise<void> {
  const validationError = validateProjectContextBody(req.body, true);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const entry = await createProjectContext({
      name: req.body.name,
      description: req.body.description,
      context_text: req.body.context_text,
      is_default: req.body.is_default,
    });

    res.status(201).json(toProjectContextResponse(entry));
  } catch (err) {
    console.error("[projectContext]", err);
    res.status(500).json({ error: "Failed to save project context." });
  }
}

export async function updateProjectContextController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  const validationError = validateProjectContextBody(req.body, false);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const updated = await updateProjectContext(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      context_text: req.body.context_text,
      is_default: req.body.is_default,
    });

    if (!updated) {
      res.status(404).json({ error: "Not found." });
      return;
    }

    res.json(toProjectContextResponse(updated));
  } catch (err) {
    console.error("[projectContext]", err);
    res.status(500).json({ error: "Failed to update project context." });
  }
}

export async function deleteProjectContextController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const deleted = await deleteProjectContext(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found." });
      return;
    }

    res.json({ id: req.params.id });
  } catch (err) {
    console.error("[projectContext]", err);
    res.status(500).json({ error: "Failed to delete project context." });
  }
}

function validateProjectContextBody(body: Record<string, unknown>, requireAll: boolean): string | null {
  if (requireAll && !isNonEmptyString(body.name)) return "name is required.";
  if (requireAll && !isNonEmptyString(body.context_text)) return "context_text is required.";

  if (body.name !== undefined && !isNonEmptyString(body.name)) return "name must be a non-empty string.";
  if (body.description !== undefined && typeof body.description !== "string") {
    return "description must be a string.";
  }
  if (body.context_text !== undefined && !isNonEmptyString(body.context_text)) {
    return "context_text must be a non-empty string.";
  }
  if (body.is_default !== undefined && typeof body.is_default !== "boolean") {
    return "is_default must be a boolean.";
  }

  return null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function toProjectContextResponse(entry: {
  _id: unknown;
  name: string;
  description: string;
  context_text: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: entry._id,
    name: entry.name,
    description: entry.description,
    context_text: entry.context_text,
    is_default: entry.is_default,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}
