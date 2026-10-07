import Legal from "../../models/admin/Legal.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const items = await Legal.find().sort({ type: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const getOne = asyncHandler(async (req, res) => {
  const item = await Legal.findOne({ type: req.params.type }).lean();
  if (!item) throw new ApiError(404, "Legal document not found");
  res.status(200).json(new ApiResponse(200, item));
});

const upsert = asyncHandler(async (req, res) => {
  const { type, title, content, status } = req.body;
  const item = await Legal.findOneAndUpdate(
    { type },
    { type, title, content, status: status || "active", updatedBy: req.admin._id },
    { upsert: true, new: true }
  );
  res.status(200).json(new ApiResponse(200, item, "Legal document saved"));
});

export { list, getOne, upsert };