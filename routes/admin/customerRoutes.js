import { Router } from "express";
import {
  list,
  details,
  suspend,
  reactivate,
  hardDelete,
} from "../../controllers/admin/customerController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);
router.post("/:id/suspend", authenticateAdmin, suspend);
router.post("/:id/reactivate", authenticateAdmin, reactivate);
router.delete("/:id/hard", authenticateAdmin, hardDelete);

export default router;