import { Request, Response } from "express";
import { runPipeline } from "../../services/Pipeline/pipeline.service";
import { createTicketSet } from "../../services/TicketSet/ticketSet.service";

export async function runPipelineController(req: Request, res: Response): Promise<void> {
  const { baData, jiraData, ticketSetName } = req.body;

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
    const name =
      typeof ticketSetName === "string" && ticketSetName.trim()
        ? ticketSetName.trim()
        : `Pipeline Results ${new Date().toISOString()}`;
    const ticketSet = await createTicketSet(name, results);
    res.json({ results, ticketSetId: ticketSet._id, ticketSetName: ticketSet.name });
  } catch (err) {
    console.error("[pipeline.controller]", err);
    res.status(500).json({ error: "Pipeline failed. Check server logs." });
  }
}
