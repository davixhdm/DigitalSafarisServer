import { Router } from "express";
import multer from "multer";
import {
  get,
  update,
  updateProfile,
  updatePreferences,
  uploadAvatar,
} from "../../controllers/customer/profileController.js";
import authenticateClient from "../../middleware/client/authenticateClient.js";

const router = Router();

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", authenticateClient, get);
router.patch("/", authenticateClient, update);
router.patch("/details", authenticateClient, updateProfile);
router.patch("/preferences", authenticateClient, updatePreferences);
router.patch(
  "/avatar",
  authenticateClient,
  uploader.single("avatar"),
  uploadAvatar
);

export default router;