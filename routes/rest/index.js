import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import menuRoutes from "./menuRoutes.js";
import menuItemRoutes from "./menuItemRoutes.js";
import orderRoutes from "./orderRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import broadcastRoutes from "./broadcastRoutes.js";
import ratingRoutes from "./ratingRoutes.js";
import walletRoutes from "./walletRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/menus", menuRoutes);
router.use("/menu-items", menuItemRoutes);
router.use("/orders", orderRoutes);
router.use("/bookings", bookingRoutes);
router.use("/broadcasts", broadcastRoutes);
router.use("/ratings", ratingRoutes);
router.use("/wallet", walletRoutes);

export default router;