import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import vehicleRoutes from "./vehicleRoutes.js";
import jobRoutes from "./jobRoutes.js";
import tripRoutes from "./tripRoutes.js";
import locationRoutes from "./locationRoutes.js";
import ratingRoutes from "./ratingRoutes.js";
import walletRoutes from "./walletRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/jobs", jobRoutes);
router.use("/trips", tripRoutes);
router.use("/location", locationRoutes);
router.use("/ratings", ratingRoutes);
router.use("/wallet", walletRoutes);

export default router;