import mongoose, { Document, Schema, Types } from "mongoose";

export type LabelHint = "Pass" | "Failed" | "Skipped" | "";

export type RawStepRow = [string, string];

export type ResultCodeSource =
  | "title_brackets[1]"
  | "source_result_code"
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
  source_result_code: string;
  title_raw: string;
  product_name: string;
  title_brackets_json: string[];
  result_code: string;
  result_code_source: ResultCodeSource;
  title_convention_status: TitleConventionStatus;
  title_parse_warnings_json: string[];
  test_case_name: string;
  type: string;
  components_json: string[];
  labels_json: string[];
  execution_type: string;
  test_repo_path: string;
  status: string;
  resolution: string;
  fix_versions_json: string[];
  description_raw: string;
  description_context: string;
  preconditions_json: string[];
  steps_raw_json: RawStepRow[];
  steps_json: IDerivedStep[];
  label_hint: LabelHint;
  routing_key: string | null;
}

export interface IDerivedTestCase extends Document {
  ticket_set_id: Types.ObjectId;
  raw_test_case_id: Types.ObjectId;
  name: string;
  source_filename: string;
  parse_version: string;
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
    parse_version:   { type: String, required: true },
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
