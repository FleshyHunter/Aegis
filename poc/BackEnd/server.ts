import express from "express";
import cors from "cors";
import { connectDB } from "./database/database";
import pipelineRoutes from "./routes/pipeline.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", pipelineRoutes);

async function start(): Promise<void> {
  if (process.env.MONGO_URI) {
    await connectDB();
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
