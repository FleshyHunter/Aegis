import { Router } from "express";
import { runPipelineController } from "../controllers/pipeline.controller";

const router = Router();

router.post("/run", runPipelineController);

export default router;
