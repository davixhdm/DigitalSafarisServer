import fs from "fs";
import {
  createBackup,
  restoreBackup,
  uploadBackup,
  downloadBackup,
  emailBackup,
  deleteBackup,
  listBackups,
  updateBackupSettings,
  getBackupSettings,
} from "../../services/backupService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const items = await listBackups();
  res.status(200).json(new ApiResponse(200, items));
});

const create = asyncHandler(async (req, res) => {
  const result = await createBackup({ type: "manual", adminId: req.admin._id });
  if (!result.success) throw new ApiError(500, result.error || "Backup failed");
  res.status(200).json(new ApiResponse(200, result.backup, "Backup created"));
});

const restore = asyncHandler(async (req, res) => {
  const result = await restoreBackup(req.params.filename, req.admin._id);
  if (!result.success) throw new ApiError(500, result.error || "Restore failed");
  res.status(200).json(new ApiResponse(200, null, "Backup restored"));
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");
  const content = fs.readFileSync(req.file.path, "utf8");
  fs.unlinkSync(req.file.path);

  const result = await uploadBackup({
    filename: req.file.originalname,
    content,
    adminId: req.admin._id,
  });
  if (!result.success) throw new ApiError(500, result.error || "Upload failed");
  res.status(200).json(new ApiResponse(200, result.backup, "Backup uploaded"));
});

const download = asyncHandler(async (req, res) => {
  const result = await downloadBackup(req.params.filename);
  if (!result.success) throw new ApiError(404, result.error || "Backup not found");
  res.download(result.path, req.params.filename);
});

const email = asyncHandler(async (req, res) => {
  const result = await emailBackup(req.params.filename);
  if (!result.success) {
    throw new ApiError(500, result.error || "Email failed");
  }

  const message =
    result.failures && result.failures.length > 0
      ? `Backup emailed to ${result.sent} admin(s), ${result.failures.length} failed`
      : "Backup emailed to all admins";

  res.status(200).json(new ApiResponse(200, result, message));
});

const remove = asyncHandler(async (req, res) => {
  await deleteBackup(req.params.filename);
  res.status(200).json(new ApiResponse(200, null, "Backup deleted"));
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getBackupSettings();
  res.status(200).json(new ApiResponse(200, settings));
});

const updateSettings = asyncHandler(async (req, res) => {
  const value = await updateBackupSettings(req.body, req.admin._id);
  res.status(200).json(new ApiResponse(200, value, "Backup settings updated"));
});

export { list, create, restore, upload, download, email, remove, getSettings, updateSettings };