import { Router } from "express";
import {
  list,
  details,
  create,
  update,
  remove,
  toggleAvailable,
} from "../../controllers/admin/downloadController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);
router.post("/", authenticateAdmin, create);
router.patch("/:id", authenticateAdmin, update);
router.delete("/:id", authenticateAdmin, remove);
router.post("/:id/toggle-available", authenticateAdmin, toggleAvailable);

export default router;