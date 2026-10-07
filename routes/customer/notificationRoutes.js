import { Router } from "express";
import {
  list,
  unreadCount,
  markRead,
  markAllRead,
  remove,
} from "../../controllers/customer/notificationController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

router.get("/", authenticateClient, list);
router.get("/unread-count", authenticateClient, unreadCount);
router.post("/:id/read", authenticateClient, markRead);
router.post("/read-all", authenticateClient, markAllRead);
router.delete("/:id", authenticateClient, remove);

export default router;