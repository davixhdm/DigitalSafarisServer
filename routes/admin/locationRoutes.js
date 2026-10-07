import { Router } from "express";
import {
  list,
  details,
  create,
  update,
  remove,
  toggleOperational,
} from "../../controllers/admin/locationController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);
router.post("/", authenticateAdmin, create);
router.patch("/:id", authenticateAdmin, update);
router.delete("/:id", authenticateAdmin, remove);
router.post("/:id/toggle-operational", authenticateAdmin, toggleOperational);

export default router;