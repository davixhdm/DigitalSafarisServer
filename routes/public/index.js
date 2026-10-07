import { Router } from "express";
import siteRoutes from "./siteRoutes.js";
import brandingRoutes from "./brandingRoutes.js";
import legalRoutes from "./legalRoutes.js";
import contactRoutes from "./contactRoutes.js";
import registerRoutes from "./registerRoutes.js";
import searchRoutes from "./searchRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import webhookRoutes from "./webhookRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import aiConciergeRoutes from "./aiConciergeRoutes.js";

const router = Router();

router.use("/site", siteRoutes);
router.use("/branding", brandingRoutes);
router.use("/legals", legalRoutes);
router.use("/contact", contactRoutes);
router.use("/register", registerRoutes);
router.use("/search", searchRoutes);
router.use("/upload", uploadRoutes);
router.use("/webhook", webhookRoutes);
router.use("/payment", paymentRoutes);
router.use("/ai-concierge", aiConciergeRoutes);

export default router;