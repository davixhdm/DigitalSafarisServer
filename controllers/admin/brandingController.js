import Branding from "../../models/admin/Branding.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const branding = (await Branding.findOne().lean()) || {};
  res.status(200).json(new ApiResponse(200, branding));
});

const update = asyncHandler(async (req, res) => {
  const existing = await Branding.findOne();
  const payload = { ...req.body, updatedBy: req.admin._id };

  const branding = existing
    ? await Branding.findByIdAndUpdate(existing._id, payload, { new: true })
    : await Branding.create(payload);

  res.status(200).json(new ApiResponse(200, branding, "Branding updated"));
});

export { get, update };