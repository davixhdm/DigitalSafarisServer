import { Router } from "express";
import {
  bookings,
  bookingDetails,
  orders,
  orderDetails,
  trips,
  tripDetails,
  broadcasts,
  broadcastDetails,
} from "../../controllers/admin/operationController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.get("/bookings", authenticateAdmin, bookings);
router.get("/bookings/:id", authenticateAdmin, bookingDetails);

router.get("/orders", authenticateAdmin, orders);
router.get("/orders/:id", authenticateAdmin, orderDetails);

router.get("/trips", authenticateAdmin, trips);
router.get("/trips/:id", authenticateAdmin, tripDetails);

router.get("/broadcasts", authenticateAdmin, broadcasts);
router.get("/broadcasts/:id", authenticateAdmin, broadcastDetails);

export default router;