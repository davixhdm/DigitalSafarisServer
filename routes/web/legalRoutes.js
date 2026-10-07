import { Router } from "express";
import { getLegal } from "../../controllers/web/legalController.js";

const router = Router();

router.get("/:type", getLegal);

export default router;