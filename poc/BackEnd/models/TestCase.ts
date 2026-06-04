import mongoose, { Document, Schema } from "mongoose";

export interface ITestCase extends Document {
  jira_ticket_id: string;
  test_case_id: string;
  step_id: string;
  source_result_code: string;
  ba_action: string;
  ba_reason: string;
  jira_action: string;
  jira_expectation: string;
  classification: "MATCH" | "PARTIAL MATCH" | "MISMATCH" | "";
  explanation: string;
  label_hint: string;
  created_at: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    jira_ticket_id:    { type: String, required: true },
    test_case_id:      { type: String, required: true },
    step_id:           { type: String, required: true },
    source_result_code:{ type: String, required: true },
    ba_action:         { type: String, default: "" },
    ba_reason:         { type: String, default: "" },
    jira_action:       { type: String, default: "" },
    jira_expectation:  { type: String, default: "" },
    classification:    {
      type: String,
      enum: ["MATCH", "PARTIAL MATCH", "MISMATCH", ""],
      default: "",
    },
    explanation:       { type: String, default: "" },
    label_hint:        { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
