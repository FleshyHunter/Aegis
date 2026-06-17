import mongoose, { Document, Schema, Types } from "mongoose";

export type PipelineRunStatus = "started" | "completed" | "failed";

export interface IPipelineRun extends Document {
  ticket_set_id: Types.ObjectId;
  ba_list_id: Types.ObjectId;
  ba_rule_scope: string;
  building_block_ids: Types.ObjectId[];
  user_prompt_text: string;
  project_context_id?: Types.ObjectId | null;
  project_context_name: string;
  project_context_text_snapshot: string;
  evaluator_version: string;
  llm_provider: string;
  llm_model: string;
  run_status: PipelineRunStatus;
  ticket_count: number;
  building_block_count: number;
  error_message: string;
  started_at: Date;
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

const PipelineRunSchema = new Schema<IPipelineRun>(
  {
    ticket_set_id: {
      type: Schema.Types.ObjectId,
      ref: "TicketSet",
      required: true,
      index: true,
    },
    
    project_context_id: {
      type: Schema.Types.ObjectId,
      ref: "ProjectContext",
      default: null,
      index: true,
    },
    project_context_name: {
      type: String,
      default: "",
      trim: true,
    },
    project_context_text_snapshot: {
      type: String,
      default: "",
    },
    ba_list_id: {
      type: Schema.Types.ObjectId,
      ref: "BAList",
      required: true,
      index: true,
    },
    ba_rule_scope: {
      type: String,
      default: "latest_by_result_code",
    },
    building_block_ids: {
      type: [Schema.Types.ObjectId],
      ref: "BuildingBlock",
      default: [],
    },
    user_prompt_text: {
      type: String,
      default: "",
    },
    evaluator_version: {
      type: String,
      default: "eval_v1",
      index: true,
    },
    llm_provider: {
      type: String,
      default: "Dify",
    },
    llm_model: {
      type: String,
      default: "",
    },
    run_status: {
      type: String,
      enum: ["started", "completed", "failed"],
      default: "started",
      index: true,
    },
    ticket_count: {
      type: Number,
      default: 0,
    },
    building_block_count: {
      type: Number,
      default: 0,
    },
    error_message: {
      type: String,
      default: "",
    },
    started_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "PipelineRuns",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const PipelineRun =
  mongoose.models.PipelineRun ||
  mongoose.model<IPipelineRun>("PipelineRun", PipelineRunSchema);
