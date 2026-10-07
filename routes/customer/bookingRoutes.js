import { Router } from "express";
import {
  create,
  list,
  details,
  cancel,
  checkIn,
} from "../../controllers/customer/bookingController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/", authenticateClient, create);
router.get("/", authenticateClient, list);
router.get("/:id", authenticateClient, details);
router.post("/:id/cancel", authenticateClient, cancel);
router.post("/:id/check-in", authenticateClient, checkIn);

export default router;