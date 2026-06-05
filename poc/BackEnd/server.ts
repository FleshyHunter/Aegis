import express from "express";
import cors from "cors";
import { connectDB, getDBStatus } from "./database/database";
import baListRoutes from "./routes/BaList/baList.routes";
import pipelineRoutes from "./routes/Pipeline/pipeline.routes";

const app = express();
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

async function start(): Promise<void> {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
