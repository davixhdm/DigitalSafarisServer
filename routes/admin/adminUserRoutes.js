import { Router } from "express";
import {
  list,
  create,
  changeRole,
  suspend,
  reactivate,
  remove,
} from "../../controllers/admin/adminUserController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/", authenticateAdmin, list);
router.post("/", authenticateAdmin, create);
router.post("/:id/role", authenticateAdmin, changeRole);
router.post("/:id/suspend", authenticateAdmin, suspend);
router.post("/:id/reactivate", authenticateAdmin, reactivate);
router.delete("/:id", authenticateAdmin, remove);

export default router;