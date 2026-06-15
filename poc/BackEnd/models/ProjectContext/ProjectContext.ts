import mongoose, { Document, Schema } from "mongoose";

export interface IProjectContext extends Document {
  name: string;
  description: string;
  context_text: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProjectContextSchema = new Schema<IProjectContext>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    context_text: {
      type: String,
      required: true,
      trim: true,
    },
    is_default: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    collection: "ProjectContexts",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const ProjectContext =
  mongoose.models.ProjectContext ||
  mongoose.model<IProjectContext>("ProjectContext", ProjectContextSchema);
