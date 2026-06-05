import { Router } from "express";
import { getAllBAListsController, getBAListByIdController, createBAListController, deleteBAListController } from "../controllers/baList.controller";

const router = Router();

router.get("/ba-lists", getAllBAListsController);
router.get("/ba-lists/:id", getBAListByIdController);
router.post("/ba-lists", createBAListController);
router.delete("/ba-lists/:id", deleteBAListController);

export default router;
