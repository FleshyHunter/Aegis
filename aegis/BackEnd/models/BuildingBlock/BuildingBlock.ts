import mongoose, { Document, Schema } from "mongoose";

export interface IBuildingBlock extends Document {
  name: string;
  file_name: string;
  source_type: "docx";
  mime_type: string;
  size_bytes: number;
  file_data: Buffer;
  preview_text: string;
  preview_status: "ready" | "unsupported" | "failed";
  preview_error: string;
  created_at: Date;
}

const BuildingBlockSchema = new Schema<IBuildingBlock>(
  {
    name:        { type: String, required: true },
    file_name:   { type: String, required: true },
    source_type: { type: String, enum: ["docx"], required: true },
    mime_type:   { type: String, default: "" },
    size_bytes:  { type: Number, default: 0 },
    file_data:   { type: Buffer, required: true },
    preview_text:   { type: String, default: "" },
    preview_status: {
      type: String,
      enum: ["ready", "unsupported", "failed"],
      default: "unsupported",
    },
    preview_error:  { type: String, default: "" },
  },
  {
    collection: "BuildingBlocks",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const BuildingBlock = mongoose.model<IBuildingBlock>("BuildingBlock", BuildingBlockSchema);
