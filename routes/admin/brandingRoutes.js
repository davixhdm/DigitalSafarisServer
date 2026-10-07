import { Router } from "express";
import { get, update } from "../../controllers/admin/brandingController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, get);
router.post("/", authenticateAdmin, update);

export default router;