import { Router } from "express";
import {
  list,
  details,
  transactions,
} from "../../controllers/admin/walletController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:type/:id", authenticateAdmin, details);
router.get("/:type/:id/transactions", authenticateAdmin, transactions);

export default router;