import { Router } from "express";
import multer from "multer";
import {
  list,
  create,
  restore,
  upload,
  download,
  email,
  remove,
  getSettings,
  updateSettings,
} from "../../controllers/admin/backupController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

const uploader = multer({
  storage: multer.diskStorage({ destination: "./backups/tmp" }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.get("/", authenticateAdmin, list);
router.post("/", authenticateAdmin, create);
router.post("/:filename/restore", authenticateAdmin, restore);
router.post("/upload", authenticateAdmin, uploader.single("file"), upload);
router.get("/:filename/download", authenticateAdmin, download);
router.post("/:filename/email", authenticateAdmin, email);
router.delete("/:filename", authenticateAdmin, remove);
router.get("/settings", authenticateAdmin, getSettings);
router.post("/settings", authenticateAdmin, updateSettings);

export default router;