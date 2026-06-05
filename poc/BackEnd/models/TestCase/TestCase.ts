import mongoose, { Document, Schema } from "mongoose";

export type ValidationClassification = "MATCH" | "MISMATCH" | "";

export interface IJiraIssueFields {
  issue_type: string;
  components: string[];
  labels: string[];
  execution_type: string;
  test_repository_path: string;
  status: string;
  resolution: string;
  fix_versions: string[];
}

export interface IXrayTestStep {
  step_number: number;
  action: string;
  expected_result: string;
}

export interface ITestCase extends Document {
  jira_key: string;
  title: string;
  test_case_id: string;
  issue_fields: IJiraIssueFields;
  description: string;
  test_steps: IXrayTestStep[];
  source_result_code: string;
  validation: {
    classification: ValidationClassification;
    explanation: string;
    label_hint: string;
  };
  created_at: Date;
  updated_at: Date;
}

const JiraIssueFieldsSchema = new Schema<IJiraIssueFields>(
  {
    issue_type:           { type: String, default: "" },
    components:           { type: [String], default: [] },
    labels:               { type: [String], default: [] },
    execution_type:       { type: String, default: "" },
    test_repository_path: { type: String, default: "" },
    status:               { type: String, default: "" },
    resolution:           { type: String, default: "" },
    fix_versions:         { type: [String], default: [] },
  },
  { _id: false }
);

const XrayTestStepSchema = new Schema<IXrayTestStep>(
  {
    step_number:     { type: Number, required: true, min: 1 },
    action:          { type: String, default: "" },
    expected_result: { type: String, default: "" },
  },
  { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    jira_key:           { type: String, required: true, unique: true, index: true },
    title:              { type: String, required: true },
    test_case_id:       { type: String, default: "", index: true },
    issue_fields:       { type: JiraIssueFieldsSchema, default: () => ({}) },
    description:        { type: String, default: "" },
    test_steps:         { type: [XrayTestStepSchema], default: [] },
    source_result_code: { type: String, default: "", index: true },
    validation: {
      classification: {
        type: String,
        enum: ["MATCH", "MISMATCH", ""],
        default: "",
      },
      explanation: { type: String, default: "" },
      label_hint:  { type: String, default: "" },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
