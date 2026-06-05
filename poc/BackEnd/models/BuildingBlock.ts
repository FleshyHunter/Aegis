import mongoose, { Document, Schema } from "mongoose";

export interface IBuildingBlock extends Document {
  block_id: string;
  name: string;
  category: string;
  action: string;
  expected_result: string;
  source_result_codes: string[];
  tags: string[];
  notes: string;
  created_at: Date;
  updated_at: Date;
}

const BuildingBlockSchema = new Schema<IBuildingBlock>(
  {
    block_id:            { type: String, required: true, unique: true, index: true },
    name:                { type: String, required: true },
    category:            { type: String, default: "", index: true },
    action:              { type: String, default: "" },
    expected_result:     { type: String, default: "" },
    source_result_codes: { type: [String], default: [], index: true },
    tags:                { type: [String], default: [] },
    notes:               { type: String, default: "" },
  },
  {
    collection: "BuildingBlocks",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const BuildingBlock = mongoose.model<IBuildingBlock>(
  "BuildingBlock",
  BuildingBlockSchema
);
