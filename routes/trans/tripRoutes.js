import { Router } from "express";
import {
  list,
  details,
  start,
  complete,
  cancel,
} from "../../controllers/trans/tripController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/", authenticateTransport, list);
router.get("/:id", authenticateTransport, details);
router.post("/:id/start", authenticateTransport, start);
router.post("/:id/complete", authenticateTransport, complete);
router.post("/:id/cancel", authenticateTransport, cancel);

export default router;