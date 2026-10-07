import { Router } from "express";
import {
  list,
  getOne,
  upsert,
} from "../../controllers/admin/legalController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.get("/:type", authenticateAdmin, getOne);
router.post("/", authenticateAdmin, upsert);

export default router;