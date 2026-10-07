import { Router } from "express";
import {
  list,
  details,
  assign,
  resolve,
  reject,
} from "../../controllers/admin/disputeController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);
router.post("/:id/assign", authenticateAdmin, assign);
router.post("/:id/resolve", authenticateAdmin, resolve);
router.post("/:id/reject", authenticateAdmin, reject);

export default router;