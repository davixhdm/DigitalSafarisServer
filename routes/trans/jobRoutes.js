import { Router } from "express";
import {
  available,
  mine,
  details,
  accept,
  pickedUp,
  delivered,
  cancel,
} from "../../controllers/trans/jobController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/available", authenticateTransport, available);
router.get("/mine", authenticateTransport, mine);
router.get("/:id", authenticateTransport, details);
router.post("/:id/accept", authenticateTransport, accept);
router.post("/:id/picked-up", authenticateTransport, pickedUp);
router.post("/:id/delivered", authenticateTransport, delivered);
router.post("/:id/cancel", authenticateTransport, cancel);

export default router;