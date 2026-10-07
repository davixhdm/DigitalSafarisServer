import { Router } from "express";
import {
  list,
  details,
  accept,
} from "../../controllers/rest/broadcastController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.get("/:id", authenticateRestaurant, details);
router.post("/:id/accept", authenticateRestaurant, accept);

export default router;