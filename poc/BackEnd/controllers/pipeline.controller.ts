import { Request, Response } from "express";
import { runPipeline } from "../services/pipeline.service";

export async function runPipelineController(req: Request, res: Response): Promise<void> {
  const { baData, jiraData } = req.body;

  if (!Array.isArray(baData) || !baData.length) {
    res.status(400).json({ error: "baData is required and must be a non-empty array." });
    return;
  }

  if (!Array.isArray(jiraData) || !jiraData.length) {
    res.status(400).json({ error: "jiraData is required and must be a non-empty array." });
    return;
  }

  try {
    const results = await runPipeline(baData, jiraData);
    res.json({ results });
  } catch (err) {
    console.error("[pipeline.controller]", err);
    res.status(500).json({ error: "Pipeline failed. Check server logs." });
  }
}
