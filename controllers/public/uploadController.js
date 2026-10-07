import { uploadFile, deleteFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");
  const folder = req.body.folder || "general";
  const result = await uploadFile(req.file.buffer, req.file.originalname, folder);
  res.status(200).json(new ApiResponse(200, result, "File uploaded"));
});

const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, "Files required");
  const folder = req.body.folder || "general";
  const results = await Promise.all(
    req.files.map((f) => uploadFile(f.buffer, f.originalname, folder))
  );
  res.status(200).json(new ApiResponse(200, results, "Files uploaded"));
});

const remove = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new ApiError(400, "publicId required");
  const result = await deleteFile(publicId);
  if (!result.success) throw new ApiError(500, result.error || "Delete failed");
  res.status(200).json(new ApiResponse(200, null, "File deleted"));
});

export { uploadSingle, uploadMultiple, remove };