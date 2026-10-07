import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import propertyRoutes from "./propertyRoutes.js";
import roomRoutes from "./roomRoutes.js";
import availabilityRoutes from "./availabilityRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import guestRoutes from "./guestRoutes.js";
import ratingRoutes from "./ratingRoutes.js";
import walletRoutes from "./walletRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/properties", propertyRoutes);
router.use("/rooms", roomRoutes);
router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/guests", guestRoutes);
router.use("/ratings", ratingRoutes);
router.use("/wallet", walletRoutes);

export default router;