import { Router } from "express";
import {
  list,
  create,
  update,
  remove,
  toggleAvailability,
} from "../../controllers/rest/menuItemController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.post("/", authenticateRestaurant, create);
router.patch("/:id", authenticateRestaurant, update);
router.delete("/:id", authenticateRestaurant, remove);
router.post("/:id/toggle-availability", authenticateRestaurant, toggleAvailability);

export default router;