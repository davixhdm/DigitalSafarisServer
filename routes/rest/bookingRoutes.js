import { Router } from "express";
import {
  list,
  details,
  accept,
  reject,
  complete,
  markNoShow,
} from "../../controllers/rest/bookingController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.get("/:id", authenticateRestaurant, details);
router.post("/:id/accept", authenticateRestaurant, accept);
router.post("/:id/reject", authenticateRestaurant, reject);
router.post("/:id/complete", authenticateRestaurant, complete);
router.post("/:id/no-show", authenticateRestaurant, markNoShow);

export default router;