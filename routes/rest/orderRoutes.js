import { Router } from "express";
import {
  list,
  details,
  accept,
  reject,
  markPreparing,
  markReady,
  requestDsTransport,
  markManualDelivery,
  markDelivered,
} from "../../controllers/rest/orderController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

router.get("/", authenticateRestaurant, list);
router.get("/:id", authenticateRestaurant, details);
router.post("/:id/accept", authenticateRestaurant, accept);
router.post("/:id/reject", authenticateRestaurant, reject);
router.post("/:id/preparing", authenticateRestaurant, markPreparing);
router.post("/:id/ready", authenticateRestaurant, markReady);
router.post("/:id/request-transport", authenticateRestaurant, requestDsTransport);
router.post("/:id/manual-delivery", authenticateRestaurant, markManualDelivery);
router.post("/:id/delivered", authenticateRestaurant, markDelivered);

export default router;