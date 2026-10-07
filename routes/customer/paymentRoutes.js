import { Router } from "express";
import {
  list,
  details,
  walletBalance,
  walletTransactions,
} from "../../controllers/customer/paymentController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/", authenticateClient, list);
router.get("/wallet", authenticateClient, walletBalance);
router.get("/wallet/transactions", authenticateClient, walletTransactions);
router.get("/:id", authenticateClient, details);

export default router;