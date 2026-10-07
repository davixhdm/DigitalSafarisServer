import { Router } from "express";
import {
  get,
  transactions,
  updatePayoutDetails,
} from "../../controllers/accom/walletController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, get);
router.get("/transactions", authenticateAccommodation, transactions);
router.post("/payout-details", authenticateAccommodation, updatePayoutDetails);

export default router;