import { Request, Response } from "express";
import { startPipeline } from "../../services/Pipeline/pipeline.service";

export async function runPipelineController(req: Request, res: Response): Promise<void> {
  const { ticketSetId, baListId, buildingBlockIds, userPrompt, projectContext } = req.body;

  if (!ticketSetId || typeof ticketSetId !== "string") {
    res.status(400).json({ error: "ticketSetId is required." });
    return;
  }

  if (baListId !== undefined && typeof baListId !== "string") {
    res.status(400).json({ error: "baListId must be a string when provided." });
    return;
  }
  const effectiveBaListId = typeof baListId === "string" && baListId.trim()
    ? baListId.trim()
    : undefined;

  if (
    !Array.isArray(buildingBlockIds) ||
    buildingBlockIds.length === 0 ||
    !buildingBlockIds.every((id) => typeof id === "string" && id.trim())
  ) {
    res.status(400).json({ error: "buildingBlockIds must contain at least one Building Block id." });
    return;
  }

  if (projectContext !== undefined && !isProjectContextInput(projectContext)) {
    res.status(400).json({ error: "projectContext must include string id, name, and contextText when provided." });
    return;
  }

  try {
    const result = await startPipeline({
      ticketSetId,
      baListId: effectiveBaListId,
      buildingBlockIds,
      userPrompt: typeof userPrompt === "string" ? userPrompt : "",
      projectContext,
    });

    res.json({
      status: result.pipelineRun.run_status,
      pipelineRunId: result.pipelineRun._id,
      ticketSetId,
      baListId: effectiveBaListId ?? null,
      buildingBlockIds,
      projectContext: projectContext ?? null,
      pipelineOutput: result.stdout,
    });
  } catch (err) {
    console.error("[pipeline.controller]", err);
    res.status(500).json({
      error: "Pipeline failed.",
      detail: err instanceof Error ? err.message : "Unknown error.",
    });
  }
}

function isProjectContextInput(value: unknown): value is {
  id?: string;
  name?: string;
  contextText?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const context = value as Record<string, unknown>;
  return (
    (context.id === undefined || typeof context.id === "string") &&
    (context.name === undefined || typeof context.name === "string") &&
    (context.contextText === undefined || typeof context.contextText === "string")
  );
}
