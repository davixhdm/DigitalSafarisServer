import { Router } from "express";
import {
  list,
  summary,
  reply,
  refreshPartnerRating,
} from "../../controllers/rest/ratingController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.get("/summary", authenticateRestaurant, summary);
router.post("/:id/reply", authenticateRestaurant, reply);
router.post("/refresh", authenticateRestaurant, refreshPartnerRating);

export default router;