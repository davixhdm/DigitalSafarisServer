import { Router } from "express";
import configRoutes from "./configRoutes.js";
import contactRoutes from "./contactRoutes.js";
import aiChatRoutes from "./aiChatRoutes.js";
import legalRoutes from "./legalRoutes.js";
import townsRoutes from "./townsRoutes.js";

const router = Router();

router.use("/config", configRoutes);
router.use("/contact", contactRoutes);
router.use("/ai-chat", aiChatRoutes);
router.use("/legal", legalRoutes);
router.use("/towns", townsRoutes);

export default router;