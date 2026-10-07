import { Router } from "express";
import {
  get,
  topUp,
  confirmTopUp,
} from "../../controllers/customer/walletController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/", authenticateClient, get);
router.post("/top-up", authenticateClient, topUp);
router.post("/top-up/confirm", authenticateClient, confirmTopUp);

export default router;