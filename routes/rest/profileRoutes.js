import { Router } from "express";
import multer from "multer";
import {
  get,
  update,
  toggleOpen,
  uploadLogo,
  uploadCover,
} from "../../controllers/rest/profileController.js";
import authenticateRestaurant from "../../middleware/partner/authenticateRestaurant.js";

const router = Router();

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", authenticateRestaurant, get);
router.patch("/", authenticateRestaurant, update);
router.post("/toggle-open", authenticateRestaurant, toggleOpen);
router.post(
  "/logo",
  authenticateRestaurant,
  uploader.single("file"),
  uploadLogo
);
router.post(
  "/cover",
  authenticateRestaurant,
  uploader.single("file"),
  uploadCover
);

export default router;