import { Router } from "express";
import {
  list,
  details,
  create,
  update,
  remove,
} from "../../controllers/accom/propertyController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, list);
router.get("/:id", authenticateAccommodation, details);
router.post("/", authenticateAccommodation, create);
router.patch("/:id", authenticateAccommodation, update);
router.delete("/:id", authenticateAccommodation, remove);

export default router;