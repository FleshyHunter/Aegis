import { Router } from "express";
import {
  getAllTicketSetsController,
  getTicketSetByIdController,
  createTicketSetController,
  deleteTicketSetController,
  updateTicketSetNameController,
} from "../../controllers/TicketSet/ticketSet.controller";

const router = Router();

router.get("/ticket-sets", getAllTicketSetsController);
router.get("/ticket-sets/:id", getTicketSetByIdController);
router.post("/ticket-sets", createTicketSetController);
router.put("/ticket-sets/:id", updateTicketSetNameController);
router.delete("/ticket-sets/:id", deleteTicketSetController);

export default router;
