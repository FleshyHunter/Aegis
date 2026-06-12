import { Types } from "mongoose";
import {
  PipelineRun,
  type IPipelineRun,
  type PipelineRunStatus,
} from "../../models/PipelineRun/PipelineRun";
import { getDerivedTestCaseTableByTicketSetId } from "../DerivedTestCase/derivedTestCase.service";

interface CreatePipelineRunInput {
  ticketSetId: string;
  baListId: string;
  buildingBlockIds: string[];
  userPrompt: string;
  evaluatorVersion?: string;
  llmProvider?: string;
  llmModel?: string;
}

export async function createPipelineRun(
  input: CreatePipelineRunInput
): Promise<IPipelineRun> {
  const derivedTable = await getDerivedTestCaseTableByTicketSetId(input.ticketSetId);

  return PipelineRun.create({
    ticket_set_id: toObjectId(input.ticketSetId, "ticketSetId"),
    ba_list_id: toObjectId(input.baListId, "baListId"),
    ba_rule_scope: "latest_by_result_code",
    building_block_ids: input.buildingBlockIds.map((id) =>
      toObjectId(id, "buildingBlockId")
    ),
    user_prompt_text: input.userPrompt.trim(),
    evaluator_version: input.evaluatorVersion ?? "eval_v1",
    llm_provider: input.llmProvider ?? "Dify",
    llm_model: input.llmModel ?? "",
    run_status: "started",
    ticket_count: derivedTable?.row_count ?? 0,
    building_block_count: input.buildingBlockIds.length,
    error_message: "",
    started_at: new Date(),
    completed_at: null,
  });
}

export async function updatePipelineRunStatus(
  id: string,
  status: PipelineRunStatus,
  options: { errorMessage?: string } = {}
) {
  return PipelineRun.findByIdAndUpdate(
    id,
    {
      run_status: status,
      error_message: options.errorMessage ?? "",
      completed_at: status === "started" ? null : new Date(),
    },
    { new: true }
  ).lean();
}

export async function getPipelineRunById(id: string) {
  return PipelineRun.findById(id).lean();
}

export async function getPipelineRunsByTicketSetId(ticketSetId: string) {
  return PipelineRun.find({ ticket_set_id: toObjectId(ticketSetId, "ticketSetId") })
    .sort({ created_at: -1 })
    .lean();
}

function toObjectId(value: string, fieldName: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return new Types.ObjectId(value);
}
