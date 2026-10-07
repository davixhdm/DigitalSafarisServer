import { Router } from "express";
import {
  list,
  create,
  update,
  remove,
} from "../../controllers/rest/menuController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.post("/", authenticateRestaurant, create);
router.patch("/:id", authenticateRestaurant, update);
router.delete("/:id", authenticateRestaurant, remove);

export default router;