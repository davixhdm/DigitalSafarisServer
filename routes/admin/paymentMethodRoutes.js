import { Router } from "express";
import {
  list,
  toggle,
  updateUsedFor,
  updateConfig,
} from "../../controllers/admin/paymentMethodController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.post("/:name/toggle", authenticateAdmin, toggle);
router.post("/:name/used-for", authenticateAdmin, updateUsedFor);
router.post("/:name/config", authenticateAdmin, updateConfig);

export default router;