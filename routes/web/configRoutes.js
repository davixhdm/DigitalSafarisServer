import { Router } from "express";
import { getSiteConfig } from "../../controllers/web/configController.js";

const router = Router();

router.get("/", getSiteConfig);

export default router;