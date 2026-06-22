import { Request, Response } from "express";
import {
  getAllTicketSets,
  getTicketSetById,
  createTicketSet,
  importTicketSet,
  deleteTicketSet,
  updateTicketSetName,
} from "../../services/TicketSet/ticketSet.service";
import { getDerivedTestCaseTableByTicketSetId } from "../../services/DerivedTestCase/derivedTestCase.service";
import { getRawTestCaseTableByTicketSetId } from "../../services/RawTestCase/rawTestCase.service";
import { getPipelineRunsByTicketSetId } from "../../services/Pipeline/pipelineRun.service";
import { getPipelineResultsByTicketSetId } from "../../services/Pipeline/pipelineResult.service";

export async function getAllTicketSetsController(_req: Request, res: Response): Promise<void> {
  try {
    const list = await getAllTicketSets();
    res.json(list.map((entry) => ({
      id: entry._id,
      name: entry.name,
      source_filename: entry.source_filename,
      source_type: entry.source_type,
      row_count: entry.row_count,
      raw_test_case_id: entry.raw_test_case_id,
      derived_test_case_id: entry.derived_test_case_id,
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
      raw_test_case_id: entry.raw_test_case_id,
      derived_test_case_id: entry.derived_test_case_id,
      created_at: entry.created_at,
    });
  } catch (err) {
    console.error("[ticketSet]", err);
    res.status(500).json({ error: "Failed to fetch ticket set." });
  }
}

export async function getDerivedTestCasesForTicketSetController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const table = await getDerivedTestCaseTableByTicketSetId(req.params.id);
    if (!table) {
      res.status(404).json({ error: "Derived test case table not found." });
      return;
    }

    res.json({
      id: table._id,
      ticket_set_id: table.ticket_set_id,
      raw_test_case_id: table.raw_test_case_id,
      name: table.name,
      source_filename: table.source_filename,
      columns: table.columns,
      rows: table.rows,
      row_count: table.row_count,
      created_at: table.created_at,
    });
  } catch (err) {
    console.error("[ticketSet/derived]", err);
    res.status(500).json({ error: "Failed to fetch derived test cases." });
  }
}

export async function getRawTestCasesForTicketSetController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const table = await getRawTestCaseTableByTicketSetId(req.params.id);
    if (!table) {
      res.status(404).json({ error: "Raw test case table not found." });
      return;
    }

    res.json({
      id: table._id,
      ticket_set_id: table.ticket_set_id,
      name: table.name,
      source_filename: table.source_filename,
      columns: table.columns,
      rows: table.rows,
      row_count: table.row_count,
      created_at: table.created_at,
    });
  } catch (err) {
    console.error("[ticketSet/raw]", err);
    res.status(500).json({ error: "Failed to fetch raw test cases." });
  }
}

export async function getPipelineRunsForTicketSetController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const runs = await getPipelineRunsByTicketSetId(req.params.id);

    res.json({
      id: req.params.id,
      name: "Pipeline runs",
      columns: [
        "run_id",
        "run_status",
        "ba_list_id",
        "ba_list_name",
        "building_block_ids",
        "building_block_names",
        "user_prompt_text",
        "project_context_id",
        "project_context_name",
        "project_context_text_snapshot",
        "evaluator_version",
        "llm_provider",
        "llm_model",
        "ticket_count",
        "building_block_count",
        "error_message",
        "started_at",
        "completed_at",
        "created_at",
      ],
      rows: runs.map((run) => ({
        run_id: run._id,
        run_status: run.run_status,
        ba_list_id: run.ba_list_id,
        ba_list_name: run.ba_list_name,
        building_block_ids: run.building_block_ids,
        building_block_names: run.building_block_names,
        user_prompt_text: run.user_prompt_text,
        project_context_id: run.project_context_id,
        project_context_name: run.project_context_name,
        project_context_text_snapshot: run.project_context_text_snapshot,
        evaluator_version: run.evaluator_version,
        llm_provider: run.llm_provider,
        llm_model: run.llm_model,
        ticket_count: run.ticket_count,
        building_block_count: run.building_block_count,
        error_message: run.error_message,
        started_at: run.started_at,
        completed_at: run.completed_at,
        created_at: run.created_at,
      })),
      row_count: runs.length,
    });
  } catch (err) {
    console.error("[ticketSet/pipeline-runs]", err);
    res.status(500).json({ error: "Failed to fetch pipeline runs." });
  }
}

export async function getPipelineResultsForTicketSetController(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const results = await getPipelineResultsByTicketSetId(req.params.id);

    res.json({
      id: req.params.id,
      name: "Pipeline results",
      columns: [
        "result_id",
        "pipeline_run_id",
        "derived_test_case_id",
        "jira_ticket_id",
        "test_case_id",
        "result_code",
        "final_classification",
        "final_reasoning",
        "selected_building_block",
        "ba_context",
        "guard_notes",
        "routing_response",
        "evaluation_response",
        "raw_evaluation_response",
        "created_at",
        "updated_at",
      ],
      rows: results.map((result) => ({
        result_id: result._id,
        pipeline_run_id: result.pipeline_run_id,
        derived_test_case_id: result.derived_test_case_id,
        jira_ticket_id: result.jira_ticket_id,
        test_case_id: result.test_case_id,
        result_code: result.result_code,
        final_classification: result.final_classification,
        final_reasoning: result.final_reasoning,
        selected_building_block: result.selected_building_block,
        ba_context: result.ba_context,
        guard_notes: result.guard_notes,
        routing_response: result.routing_response,
        evaluation_response: result.evaluation_response,
        raw_evaluation_response: result.raw_evaluation_response,
        created_at: result.created_at,
        updated_at: result.updated_at,
      })),
      row_count: results.length,
    });
  } catch (err) {
    console.error("[ticketSet/pipeline-results]", err);
    res.status(500).json({ error: "Failed to fetch pipeline results." });
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

export async function importTicketSetController(req: Request, res: Response): Promise<void> {
  const { name, sourceFilename, rows } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "rows must be a non-empty array." });
    return;
  }

  const invalidRow = rows.find(
    (row) => !row || typeof row !== "object" || Array.isArray(row)
  );
  if (invalidRow) {
    res.status(400).json({ error: "rows must contain objects only." });
    return;
  }

  try {
    const result = await importTicketSet({
      name: name.trim(),
      sourceFilename:
        typeof sourceFilename === "string" && sourceFilename.trim()
          ? sourceFilename.trim()
          : name.trim(),
      rows,
    });

    res.status(201).json({
      id: result.ticketSet._id,
      name: result.ticketSet.name,
      source_filename: result.ticketSet.source_filename,
      source_type: result.ticketSet.source_type,
      row_count: result.ticketSet.row_count,
      raw_test_case_id: result.rawTestCase._id,
      derived_test_case_id: result.derivedTestCase._id,
      raw_document_count: 1,
      derived_document_count: 1,
      created_at: result.ticketSet.created_at,
    });
  } catch (err) {
    console.error("[ticketSet/import]", err);
    res.status(500).json({ error: "Failed to import ticket set." });
  }
}
