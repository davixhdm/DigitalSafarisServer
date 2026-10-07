import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../../controllers/web/aiChatController.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: "Too many messages. Please wait a minute." },
});

router.post("/", limiter, chat);

export default router;