import { Router } from "express";
import {
  list,
  summary,
  reply,
  refreshPartnerRating,
} from "../../controllers/accom/ratingController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, list);
router.get("/summary", authenticateAccommodation, summary);
router.post("/:id/reply", authenticateAccommodation, reply);
router.post("/refresh", authenticateAccommodation, refreshPartnerRating);

export default router;