import { Router } from "express";
import multer from "multer";
import {
  uploadSingle,
  uploadMultiple,
  remove,
} from "../../controllers/public/uploadController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/single", upload.single("file"), uploadSingle);
router.post("/multiple", upload.array("files", 10), uploadMultiple);
router.post("/remove", remove);

export default router;