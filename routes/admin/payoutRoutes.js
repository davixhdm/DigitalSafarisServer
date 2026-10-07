import { Router } from "express";
import {
  list,
  getSettings,
  updateSettings,
  approve,
  reject,
} from "../../controllers/admin/payoutController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/settings", authenticateAdmin, getSettings);
router.post("/settings", authenticateAdmin, updateSettings);
router.post("/:id/approve", authenticateAdmin, approve);
router.post("/:id/reject", authenticateAdmin, reject);

export default router;