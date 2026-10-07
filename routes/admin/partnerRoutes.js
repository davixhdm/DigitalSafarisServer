import { Router } from "express";
import {
  list,
  details,
  approve,
  reject,
  suspend,
  reactivate,
  hardDelete,
} from "../../controllers/admin/partnerController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/:type", authenticateAdmin, list);
router.get("/:type/:id", authenticateAdmin, details);
router.post("/:type/:id/approve", authenticateAdmin, approve);
router.post("/:type/:id/reject", authenticateAdmin, reject);
router.post("/:type/:id/suspend", authenticateAdmin, suspend);
router.post("/:type/:id/reactivate", authenticateAdmin, reactivate);
router.delete("/:type/:id/hard", authenticateAdmin, hardDelete);

export default router;