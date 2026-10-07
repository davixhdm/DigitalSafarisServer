import { Router } from "express";
import { list, details } from "../../controllers/admin/paymentController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:id", authenticateAdmin, details);

export default router;