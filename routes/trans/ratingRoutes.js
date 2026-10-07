import { Router } from "express";
import {
  list,
  summary,
  refreshPartnerRating,
} from "../../controllers/trans/ratingController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/", authenticateTransport, list);
router.get("/summary", authenticateTransport, summary);
router.post("/refresh", authenticateTransport, refreshPartnerRating);

export default router;