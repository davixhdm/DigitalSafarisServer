import { Router } from "express";
import {
  getLegal,
  getLegalByType,
} from "../../controllers/public/siteController.js";

const router = Router();

router.get("/", getLegal);
router.get("/:type", getLegalByType);

export default router;