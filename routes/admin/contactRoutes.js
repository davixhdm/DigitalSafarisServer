import { Router } from "express";
import {
  list,
  details,
  updateStatus,
  remove,
  create,
} from "../../controllers/admin/contactController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.post("/", create);
router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);
router.post("/:id/status", authenticateAdmin, updateStatus);
router.delete("/:id", authenticateAdmin, remove);

export default router;