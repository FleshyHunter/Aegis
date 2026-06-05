import mongoose, { Document, Schema } from "mongoose";

export interface IBAList extends Document {
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: Date;
}

const BAListSchema = new Schema<IBAList>(
  {
    name:      { type: String, required: true },
    columns:   { type: [String], default: [] },
    rows:      { type: Schema.Types.Mixed, default: [] },
    row_count: { type: Number, default: 0 },
  },
  {
    collection: "BALists",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const BAList = mongoose.model<IBAList>("BAList", BAListSchema);
