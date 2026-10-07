import { Router } from "express";
import { getBranding } from "../../controllers/public/siteController.js";

const router = Router();

router.get("/", getBranding);

export default router;