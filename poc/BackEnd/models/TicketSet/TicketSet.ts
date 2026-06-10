import mongoose, { Document, Schema } from "mongoose";

export type TicketSetSourceType = "csv" | "docx" | "jira_api" | "pipeline_result";

export interface ITicketSet extends Document {
  name: string;
  source_filename: string;
  source_type: TicketSetSourceType;
  row_count: number;
  created_at: Date;
  updated_at: Date;
}

const TicketSetSchema = new Schema<ITicketSet>(
  {
    name:            { type: String, required: true, index: true },
    source_filename: { type: String, default: "" },
    source_type: {
      type: String,
      enum: ["csv", "docx", "jira_api", "pipeline_result"],
      default: "csv",
      index: true,
    },
    row_count:       { type: Number, default: 0 },
  },
  {
    collection: "TicketSets",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const TicketSet = mongoose.model<ITicketSet>("TicketSet", TicketSetSchema);
