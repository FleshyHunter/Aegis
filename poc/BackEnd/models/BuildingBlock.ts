import mongoose, { Document, Schema } from "mongoose";

export interface IBuildingBlock extends Document {
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  row_count: number;
  created_at: Date;
}

const BuildingBlockSchema = new Schema<IBuildingBlock>(
  {
    name:      { type: String, required: true },
    columns:   { type: [String], default: [] },
    rows:      { type: Schema.Types.Mixed, default: [] },
    row_count: { type: Number, default: 0 },
  },
  {
    collection: "BuildingBlocks",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const BuildingBlock = mongoose.model<IBuildingBlock>("BuildingBlock", BuildingBlockSchema);
