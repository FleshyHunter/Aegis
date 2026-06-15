import { Router } from "express";
import {
  createProjectContextController,
  deleteProjectContextController,
  getAllProjectContextsController,
  getProjectContextByIdController,
  updateProjectContextController,
} from "../../controllers/ProjectContext/projectContext.controller";

const router = Router();

router.get("/project-contexts", getAllProjectContextsController);
router.get("/project-contexts/:id", getProjectContextByIdController);
router.post("/project-contexts", createProjectContextController);
router.put("/project-contexts/:id", updateProjectContextController);
router.delete("/project-contexts/:id", deleteProjectContextController);

export default router;
