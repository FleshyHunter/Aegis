import mongoose, { Document, Schema, Types } from "mongoose";

export type LabelHint = "Pass" | "Failed" | "Skipped" | "";

export type RawStepRow = [string, string];

export interface IRawTestCase extends Document {
  ticket_set_id: Types.ObjectId;
  jira_ticket_id: string;
  test_case_id: string;
  title_raw: string;
  type: string;
  components_raw: string;
  labels_raw: string;
  execution_type: string;
  test_repo_path: string;
  status: string;
  resolution: string;
  fix_versions_raw: string;
  description_raw: string;
  steps_raw_json: RawStepRow[];
  label_hint: LabelHint;
  created_at: Date;
}

const RawTestCaseSchema = new Schema<IRawTestCase>(
  {
    ticket_set_id: {
      type: Schema.Types.ObjectId,
      ref: "TicketSet",
      required: true,
      index: true,
    },
    jira_ticket_id:  { type: String, default: "", index: true },
    test_case_id:    { type: String, default: "", index: true },
    title_raw:       { type: String, default: "" },
    type:            { type: String, default: "" },
    components_raw:  { type: String, default: "" },
    labels_raw:      { type: String, default: "" },
    execution_type:  { type: String, default: "" },
    test_repo_path:  { type: String, default: "" },
    status:          { type: String, default: "" },
    resolution:      { type: String, default: "" },
    fix_versions_raw:{ type: String, default: "" },
    description_raw: { type: String, default: "" },
    steps_raw_json:  { type: Schema.Types.Mixed, default: [] },
    label_hint: {
      type: String,
      enum: ["Pass", "Failed", "Skipped", ""],
      default: "",
    },
  },
  {
    collection: "RawTestCases",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const RawTestCase = mongoose.model<IRawTestCase>(
  "RawTestCase",
  RawTestCaseSchema
);
