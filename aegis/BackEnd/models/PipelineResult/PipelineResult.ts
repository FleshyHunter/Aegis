import mongoose, { Document, Schema, Types } from "mongoose";

export type PipelineFinalClassification = "Pass" | "Failed" | "Skipped" | "";

export interface IPipelineResult extends Document {
  pipeline_run_id: Types.ObjectId;
  ticket_set_id: Types.ObjectId;
  derived_test_case_id: string;
  jira_ticket_id: string;
  test_case_id: string;
  result_code: string;
  routing_response: Record<string, unknown> | null;
  selected_building_block: Record<string, unknown> | null;
  ba_context: Record<string, unknown> | null;
  raw_evaluation_response: Record<string, unknown> | null;
  evaluation_response: Record<string, unknown> | null;
  guard_notes: string[];
  final_classification: PipelineFinalClassification;
  final_reasoning: string;
  created_at: Date;
  updated_at: Date;
}

const PipelineResultSchema = new Schema<IPipelineResult>(
  {
    pipeline_run_id: {
      type: Schema.Types.ObjectId,
      ref: "PipelineRun",
      required: true,
      index: true,
    },
    ticket_set_id: {
      type: Schema.Types.ObjectId,
      ref: "TicketSet",
      required: true,
      index: true,
    },
    derived_test_case_id: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    jira_ticket_id: {
      type: String,
      default: "",
      trim: true,
    },
    test_case_id: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    result_code: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    routing_response: {
      type: Schema.Types.Mixed,
      default: null,
    },
    selected_building_block: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ba_context: {
      type: Schema.Types.Mixed,
      default: null,
    },
    raw_evaluation_response: {
      type: Schema.Types.Mixed,
      default: null,
    },
    evaluation_response: {
      type: Schema.Types.Mixed,
      default: null,
    },
    guard_notes: {
      type: [String],
      default: [],
    },
    final_classification: {
      type: String,
      enum: ["Pass", "Failed", "Skipped", ""],
      default: "",
      index: true,
    },
    final_reasoning: {
      type: String,
      default: "",
    },
  },
  {
    collection: "PipelineResults",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

PipelineResultSchema.index({ pipeline_run_id: 1, derived_test_case_id: 1 });

export const PipelineResult =
  mongoose.models.PipelineResult ||
  mongoose.model<IPipelineResult>("PipelineResult", PipelineResultSchema);
