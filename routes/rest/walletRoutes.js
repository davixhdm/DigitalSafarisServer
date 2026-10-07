import { Router } from "express";
import {
  get,
  transactions,
  updatePayoutDetails,
} from "../../controllers/rest/walletController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, get);
router.get("/transactions", authenticateRestaurant, transactions);
router.post("/payout-details", authenticateRestaurant, updatePayoutDetails);

export default router;