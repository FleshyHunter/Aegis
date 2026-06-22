import { Types } from "mongoose";
import {
  PipelineResult,
  type IPipelineResult,
  type PipelineFinalClassification,
} from "../../models/PipelineResult/PipelineResult";
import { getDerivedTestCaseTableByTicketSetId } from "../DerivedTestCase/derivedTestCase.service";

interface PipelineResultOutputRow {
  derived_test_case_id?: unknown;
  jira_ticket_id?: unknown;
  test_case_id?: unknown;
  result_code?: unknown;
  routing?: unknown;
  selected_building_block?: unknown;
  ba_context?: unknown;
  raw_evaluation?: unknown;
  evaluation?: unknown;
  guard_notes?: unknown;
  final_classification?: unknown;
  final_reasoning?: unknown;
}

interface ReplacePipelineResultsInput {
  pipelineRunId: string;
  ticketSetId: string;
  results: PipelineResultOutputRow[];
}

export interface PipelineResultSummaryRow {
  jira_ticket_id: string;
  test_case_id: string;
  source_result_code: string;
  classification: PipelineFinalClassification;
  building_block: string;
  explanation: string;
  label_hint: string;
}

export async function replacePipelineResultsForRun(
  input: ReplacePipelineResultsInput
): Promise<IPipelineResult[]> {
  const pipelineRunObjectId = toObjectId(input.pipelineRunId, "pipelineRunId");
  const ticketSetObjectId = toObjectId(input.ticketSetId, "ticketSetId");

  await PipelineResult.deleteMany({ pipeline_run_id: pipelineRunObjectId });

  if (!input.results.length) return [];

  return PipelineResult.insertMany(
    input.results.map((result) => ({
      pipeline_run_id: pipelineRunObjectId,
      ticket_set_id: ticketSetObjectId,
      derived_test_case_id: toText(result.derived_test_case_id),
      jira_ticket_id: toText(result.jira_ticket_id),
      test_case_id: toText(result.test_case_id),
      result_code: toText(result.result_code),
      routing_response: toObjectOrNull(result.routing),
      selected_building_block: toObjectOrNull(result.selected_building_block),
      ba_context: toObjectOrNull(result.ba_context),
      raw_evaluation_response: toObjectOrNull(result.raw_evaluation),
      evaluation_response: toObjectOrNull(result.evaluation),
      guard_notes: toStringArray(result.guard_notes),
      final_classification: toFinalClassification(result.final_classification),
      final_reasoning: toText(result.final_reasoning),
    }))
  );
}

export async function getPipelineResultsByRunId(pipelineRunId: string) {
  return PipelineResult.find({
    pipeline_run_id: toObjectId(pipelineRunId, "pipelineRunId"),
  })
    .sort({ created_at: 1 })
    .lean();
}

export async function getPipelineResultsByTicketSetId(ticketSetId: string) {
  return PipelineResult.find({
    ticket_set_id: toObjectId(ticketSetId, "ticketSetId"),
  })
    .sort({ created_at: -1 })
    .lean();
}

export async function getPipelineResultSummaryByTicketSetId(
  ticketSetId: string
): Promise<PipelineResultSummaryRow[]> {
  const ticketSetObjectId = toObjectId(ticketSetId, "ticketSetId");
  const latestResult = await PipelineResult.findOne({
    ticket_set_id: ticketSetObjectId,
  })
    .sort({ created_at: -1 })
    .lean();

  if (!latestResult) return [];

  const [results, derivedTable] = await Promise.all([
    PipelineResult.find({
      ticket_set_id: ticketSetObjectId,
      pipeline_run_id: latestResult.pipeline_run_id,
    })
      .sort({ created_at: 1 })
      .lean(),
    getDerivedTestCaseTableByTicketSetId(ticketSetId),
  ]);

  const labelHints = new Map<string, string>();
  for (const row of derivedTable?.rows ?? []) {
    labelHints.set(
      buildResultKey(row.jira_ticket_id, row.test_case_id),
      toText(row.label_hint)
    );
  }

  return results.map((result) => ({
    jira_ticket_id: result.jira_ticket_id,
    test_case_id: result.test_case_id,
    source_result_code: result.result_code,
    classification: result.final_classification,
    building_block: getSelectedBuildingBlockTitle(result.selected_building_block),
    explanation: result.final_reasoning,
    label_hint: labelHints.get(buildResultKey(result.jira_ticket_id, result.test_case_id)) ?? "",
  }));
}

function toObjectId(value: string, fieldName: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return new Types.ObjectId(value);
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toObjectOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getSelectedBuildingBlockTitle(value: unknown): string {
  const selected = toObjectOrNull(value);
  if (!selected) return "";

  return toText(selected.title ?? selected.block_id ?? selected.building_block_id);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

function toFinalClassification(value: unknown): PipelineFinalClassification {
  if (value === "Pass" || value === "Failed" || value === "Skipped") {
    return value;
  }

  return "";
}

function buildResultKey(jiraTicketId: unknown, testCaseId: unknown): string {
  return `${toText(jiraTicketId).toLowerCase()}::${toText(testCaseId).toLowerCase()}`;
}
