import { Router } from "express";
import multer from "multer";
import {
  get,
  update,
  uploadAvatar,
  uploadLogo,
  uploadCover,
} from "../../controllers/accom/profileController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", authenticateAccommodation, get);
router.patch("/", authenticateAccommodation, update);
router.post(
  "/avatar",
  authenticateAccommodation,
  uploader.single("file"),
  uploadAvatar
);
router.post(
  "/logo",
  authenticateAccommodation,
  uploader.single("file"),
  uploadLogo
);
router.post(
  "/cover",
  authenticateAccommodation,
  uploader.single("file"),
  uploadCover
);

export default router;