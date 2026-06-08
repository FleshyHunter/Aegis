import mongoose from "mongoose";
import { loadEnv } from "../config/env";
import { BAList, BuildingBlock, TicketSet } from "../models";

loadEnv();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/idemia";

export function getDBStatus(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] ?? "unknown";
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    await initializeCollections();
    console.log("MongoDB connected:", MONGO_URI);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

async function initializeCollections(): Promise<void> {
  await Promise.all([
    BAList.createCollection(),
    BuildingBlock.createCollection(),
    TicketSet.createCollection(),
  ]);

  await Promise.all([
    BAList.syncIndexes(),
    BuildingBlock.syncIndexes(),
    TicketSet.syncIndexes(),
  ]);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

export default mongoose;
