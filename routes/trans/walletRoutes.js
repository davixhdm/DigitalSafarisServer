import { Router } from "express";
import {
  get,
  transactions,
  updatePayoutDetails,
} from "../../controllers/trans/walletController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

router.get("/", authenticateTransport, get);
router.get("/transactions", authenticateTransport, transactions);
router.post("/payout-details", authenticateTransport, updatePayoutDetails);

export default router;