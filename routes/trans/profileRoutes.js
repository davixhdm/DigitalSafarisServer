import { Router } from "express";
import multer from "multer";
import {
  get,
  update,
  goOnline,
  goOffline,
  uploadAvatar,
} from "../../controllers/trans/profileController.js";
import authenticateTransport from "../../middleware/partner/authenticateTransport.js";

const router = Router();

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", authenticateTransport, get);
router.patch("/", authenticateTransport, update);
router.post("/online", authenticateTransport, goOnline);
router.post("/offline", authenticateTransport, goOffline);
router.post(
  "/avatar",
  authenticateTransport,
  uploader.single("file"),
  uploadAvatar
);

export default router;