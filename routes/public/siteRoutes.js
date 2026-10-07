import { Router } from "express";
import { getSite } from "../../controllers/public/siteController.js";

const router = Router();

router.get("/", getSite);

export default router;