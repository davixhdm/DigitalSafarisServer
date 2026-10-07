import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../../controllers/customer/aiConciergeController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many chat requests. Please wait a minute and try again.",
  },
});

router.post("/chat", authenticateClient, chatLimiter, chat);

export default router;