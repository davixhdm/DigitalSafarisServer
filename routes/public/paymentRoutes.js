import { Router } from "express";
import {
  initiateMpesa,
  mpesaCallback,
  initiateStripe,
  stripeCallback,
  payWithWallet,
  status,
} from "../../controllers/public/paymentController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.post("/mpesa/callback", mpesaCallback);
router.post("/stripe/callback", stripeCallback);

router.post("/mpesa/initiate", authenticateClient, initiateMpesa);
router.post("/stripe/initiate", authenticateClient, initiateStripe);
router.post("/wallet/pay", authenticateClient, payWithWallet);
router.get("/status/:reference", authenticateClient, status);

export default router;