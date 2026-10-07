import { Router } from "express";
import { health, ready, metrics } from "../../controllers/admin/healthController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, health);
router.get("/ready", ready);
router.get("/metrics", authenticateAdmin, metrics);

export default router;