import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const items = await SystemSetting.find().sort({ group: 1, key: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const getOne = asyncHandler(async (req, res) => {
  const item = await SystemSetting.findOne({ key: req.params.key }).lean();
  if (!item) throw new ApiError(404, "Setting not found");
  res.status(200).json(new ApiResponse(200, item));
});

const upsert = asyncHandler(async (req, res) => {
  const { key, value, group } = req.body;
  const item = await SystemSetting.findOneAndUpdate(
    { key },
    { key, value, group: group || "general", updatedBy: req.admin._id },
    { upsert: true, new: true }
  );
  res.status(200).json(new ApiResponse(200, item, "Setting saved"));
});

export { list, getOne, upsert };