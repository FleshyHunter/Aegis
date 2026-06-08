import { loadEnv } from "./config/env";
import express from "express";
import cors from "cors";
import { connectDB, getDBStatus } from "./database/database";
import baListRoutes from "./routes/BaList/baList.routes";
import buildingBlockRoutes from "./routes/BuildingBlock/buildingBlock.routes";
import pipelineRoutes from "./routes/Pipeline/pipeline.routes";
import ticketSetRoutes from "./routes/TicketSet/ticketSet.routes";

const app = express();
loadEnv();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: getDBStatus(),
  });
});

app.use("/api", pipelineRoutes);
app.use("/api", baListRoutes);
app.use("/api", buildingBlockRoutes);
app.use("/api", ticketSetRoutes);

async function start(): Promise<void> {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
