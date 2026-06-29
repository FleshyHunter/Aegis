import mongoose, { Document, Schema, Types } from "mongoose";

export type SourceTestCaseRow = Record<string, string>;

export interface IRawTestCase extends Document {
  ticket_set_id: Types.ObjectId;
  name: string;
  source_filename: string;
  columns: string[];
  rows: SourceTestCaseRow[];
  row_count: number;
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
    name:            { type: String, required: true, index: true },
    source_filename: { type: String, default: "" },
    columns:         { type: [String], default: [] },
    rows:            { type: Schema.Types.Mixed, default: [] },
    row_count:       { type: Number, default: 0 },
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
