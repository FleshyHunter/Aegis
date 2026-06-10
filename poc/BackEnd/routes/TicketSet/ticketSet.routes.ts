import { Router } from "express";
import {
  getAllTicketSetsController,
  getDerivedTestCasesForTicketSetController,
  getRawTestCasesForTicketSetController,
  getTicketSetByIdController,
  createTicketSetController,
  importTicketSetController,
  deleteTicketSetController,
  updateTicketSetNameController,
} from "../../controllers/TicketSet/ticketSet.controller";

const router = Router();

router.get("/ticket-sets", getAllTicketSetsController);
router.post("/ticket-sets", createTicketSetController);
router.post("/ticket-sets/import", importTicketSetController);
router.get("/ticket-sets/:id/raw-test-cases", getRawTestCasesForTicketSetController);
router.get("/ticket-sets/:id/derived-test-cases", getDerivedTestCasesForTicketSetController);
router.get("/ticket-sets/:id", getTicketSetByIdController);
router.put("/ticket-sets/:id", updateTicketSetNameController);
router.delete("/ticket-sets/:id", deleteTicketSetController);

export default router;
