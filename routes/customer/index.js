import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import addressRoutes from "./addressRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import orderRoutes from "./orderRoutes.js";
import dineInRoutes from "./dineInRoutes.js";
import broadcastRoutes from "./broadcastRoutes.js";
import tripRoutes from "./tripRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import walletRoutes from "./walletRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import trackingRoutes from "./trackingRoutes.js";
import searchRoutes from "./searchRoutes.js";
import aiConciergeRoutes from "./aiConciergeRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/addresses", addressRoutes);
router.use("/bookings", bookingRoutes);
router.use("/orders", orderRoutes);
router.use("/dine-in", dineInRoutes);
router.use("/broadcasts", broadcastRoutes);
router.use("/trips", tripRoutes);
router.use("/payments", paymentRoutes);
router.use("/wallet", walletRoutes);
router.use("/reviews", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/tracking", trackingRoutes);
router.use("/search", searchRoutes);
router.use("/ai-concierge", aiConciergeRoutes);

export default router;