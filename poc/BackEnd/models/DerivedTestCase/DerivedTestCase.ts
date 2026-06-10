import mongoose, { Document, Schema, Types } from "mongoose";
import type { LabelHint, RawStepRow } from "../RawTestCase/RawTestCase";

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

export interface IDerivedTestCase extends Document {
  raw_test_case_id: Types.ObjectId;
  ticket_set_id: Types.ObjectId;
  parse_version: string;
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
  created_at: Date;
}

const DerivedStepSchema = new Schema<IDerivedStep>(
  {
    step:     { type: Number, required: true, min: 1 },
    action:   { type: String, default: "" },
    expected: { type: [String], default: [] },
  },
  { _id: false }
);

const DerivedTestCaseSchema = new Schema<IDerivedTestCase>(
  {
    raw_test_case_id: {
      type: Schema.Types.ObjectId,
      ref: "RawTestCase",
      required: true,
      unique: true,
      index: true,
    },
    ticket_set_id: {
      type: Schema.Types.ObjectId,
      ref: "TicketSet",
      required: true,
      index: true,
    },
    parse_version:             { type: String, required: true },
    title_raw:                 { type: String, default: "" },
    product_name:              { type: String, default: "" },
    title_brackets_json:       { type: [String], default: [] },
    result_code:               { type: String, default: "", index: true },
    result_code_source: {
      type: String,
      enum: ["title_brackets[1]", "fallback_bracket_scan", "fallback_title_text", "not_found"],
      default: "not_found",
    },
    title_convention_status: {
      type: String,
      enum: ["standard", "outlier", "invalid"],
      default: "invalid",
    },
    title_parse_warnings_json: { type: [String], default: [] },
    test_case_name:            { type: String, default: "" },
    type:                      { type: String, default: "" },
    components_json:           { type: [String], default: [] },
    labels_json:               { type: [String], default: [] },
    execution_type:            { type: String, default: "" },
    test_repo_path:            { type: String, default: "" },
    status:                    { type: String, default: "" },
    resolution:                { type: String, default: "" },
    fix_versions_json:         { type: [String], default: [] },
    description_raw:           { type: String, default: "" },
    description_context:       { type: String, default: "" },
    preconditions_json:        { type: [String], default: [] },
    steps_raw_json:            { type: Schema.Types.Mixed, default: [] },
    steps_json:                { type: [DerivedStepSchema], default: [] },
    label_hint: {
      type: String,
      enum: ["Pass", "Failed", "Skipped", ""],
      default: "",
    },
    routing_key:               { type: String, default: null },
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
