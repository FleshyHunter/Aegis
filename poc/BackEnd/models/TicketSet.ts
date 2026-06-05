import mongoose, { Document, Schema } from "mongoose";

export interface ITicketSetItem {
  [key: string]: string;
}

export interface ITicketSet extends Document {
  name: string;
  columns: string[];
  rows: ITicketSetItem[];
  row_count: number;
  created_at: Date;
}

const TicketSetSchema = new Schema<ITicketSet>(
  {
    name:      { type: String, required: true },
    columns:   { type: [String], default: [] },
    rows:      { type: Schema.Types.Mixed, default: [] },
    row_count: { type: Number, default: 0 },
  },
  {
    collection: "TicketSets",
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export const TicketSet = mongoose.model<ITicketSet>("TicketSet", TicketSetSchema);
