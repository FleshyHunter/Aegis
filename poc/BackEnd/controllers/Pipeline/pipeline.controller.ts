import { Request, Response } from "express";
import { startPipeline } from "../../services/Pipeline/pipeline.service";

export async function runPipelineController(req: Request, res: Response): Promise<void> {
  const { ticketSetId, baListId, buildingBlockIds, userPrompt } = req.body;

  if (!ticketSetId || typeof ticketSetId !== "string") {
    res.status(400).json({ error: "ticketSetId is required." });
    return;
  }

  if (buildingBlockIds !== undefined && !Array.isArray(buildingBlockIds)) {
    res.status(400).json({ error: "buildingBlockIds must be an array when provided." });
    return;
  }

  try {
    const result = await startPipeline({
      ticketSetId,
      baListId: typeof baListId === "string" ? baListId : "",
      buildingBlockIds: buildingBlockIds ?? [],
      userPrompt: typeof userPrompt === "string" ? userPrompt : "",
    });

    res.json({
      status: "started",
      ticketSetId,
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
