import { Router } from "express";
import {
  revenue,
  payouts,
  payments,
} from "../../controllers/admin/reportController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/revenue", authenticateAdmin, revenue);
router.get("/payouts", authenticateAdmin, payouts);
router.get("/payments", authenticateAdmin, payments);

export default router;