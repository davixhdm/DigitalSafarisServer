import { Router } from "express";
import { overview } from "../../controllers/admin/dashboardController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/overview", authenticateAdmin, overview);

export default router;