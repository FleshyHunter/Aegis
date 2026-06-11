import mongoose, { Document, Schema, Types } from "mongoose";

export type LabelHint = "Pass" | "Failed" | "Skipped" | "";

export type RawStepRow = [string, string];

export type ResultCodeSource =
  | "title_brackets[1]"
  | "fallback_bracket_scan"
  | "fallback_title_text"
  | "not_found";

export type TitleConventionStatus = "standard" | "outlier" | "invalid";

export interface IDerivedStep {
  step: number;
  action: string;
  expected: string[];
}

export interface DerivedTestCaseTableRow extends Record<string, unknown> {
  jira_ticket_id: string;
  test_case_id: string;
  title_raw: string;
  product_name: string;
  title_brackets: string[];
  result_code: string;
  result_code_source: ResultCodeSource;
  title_convention_status: TitleConventionStatus;
  title_parse_warnings: string[];
  test_case_name: string;
  type: string;
  components: string[];
  labels: string[];
  execution_type: string;
  test_repo_path: string;
  status: string;
  resolution: string;
  fix_versions: string[];
  description_raw: string;
  description_context: string;
  preconditions: string[];
  steps_raw: RawStepRow[];
  steps: IDerivedStep[];
  label_hint: LabelHint;
  routing_key: string | null;
}

export interface IDerivedTestCase extends Document {
  ticket_set_id: Types.ObjectId;
  raw_test_case_id: Types.ObjectId;
  name: string;
  source_filename: string;
  columns: string[];
  rows: DerivedTestCaseTableRow[];
  row_count: number;
  created_at: Date;
}

const DerivedTestCaseSchema = new Schema<IDerivedTestCase>(
  {
    ticket_set_id: {
      type: Schema.Types.ObjectId,
      ref: "TicketSet",
      required: true,
      index: true,
    },
    raw_test_case_id: {
      type: Schema.Types.ObjectId,
      ref: "RawTestCase",
      required: true,
      unique: true,
      index: true,
    },
    name:            { type: String, required: true, index: true },
    source_filename: { type: String, default: "" },
    columns:         { type: [String], default: [] },
    rows:            { type: Schema.Types.Mixed, default: [] },
    row_count:       { type: Number, default: 0 },
  },
  {
    collection: "DerivedTestCases",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const DerivedTestCase = mongoose.model<IDerivedTestCase>(
  "DerivedTestCase",
  DerivedTestCaseSchema
);
