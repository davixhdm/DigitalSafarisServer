import { Router } from "express";
import {
  trackTrip,
  trackDelivery,
  trackBooking,
} from "../../controllers/customer/trackingController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/trip/:reference", authenticateClient, trackTrip);
router.get("/delivery/:reference", authenticateClient, trackDelivery);
router.get("/booking/:reference", authenticateClient, trackBooking);

export default router;