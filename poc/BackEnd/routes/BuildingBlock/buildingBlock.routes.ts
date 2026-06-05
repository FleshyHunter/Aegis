import { Router } from "express";
import {
  getAllBuildingBlocksController,
  getBuildingBlockByIdController,
  createBuildingBlockController,
  deleteBuildingBlockController,
  updateBuildingBlockNameController,
} from "../../controllers/BuildingBlock/buildingBlock.controller";

const router = Router();

router.get("/building-blocks", getAllBuildingBlocksController);
router.get("/building-blocks/:id", getBuildingBlockByIdController);
router.post("/building-blocks", createBuildingBlockController);
router.put("/building-blocks/:id", updateBuildingBlockNameController);
router.delete("/building-blocks/:id", deleteBuildingBlockController);

export default router;
