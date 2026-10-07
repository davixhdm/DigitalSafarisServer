import { Router } from "express";
import {
  list,
  details,
  retry,
  confirm,
} from "../../controllers/customer/paymentController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/", authenticateClient, list);
router.get("/:id", authenticateClient, details);
router.post("/:id/retry", authenticateClient, retry);
router.post("/:id/confirm", authenticateClient, confirm);

export default router;