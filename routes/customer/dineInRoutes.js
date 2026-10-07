import { Router } from "express";
import {
  create,
  list,
  details,
  cancel,
} from "../../controllers/customer/dineInController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/", authenticateClient, create);
router.get("/", authenticateClient, list);
router.get("/:id", authenticateClient, details);
router.post("/:id/cancel", authenticateClient, cancel);

export default router;