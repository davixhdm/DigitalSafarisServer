import Payout from "../../models/admin/Payout.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Payout.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const getSettings = asyncHandler(async (req, res) => {
  const doc = await SystemSetting.findOne({ key: "payout" }).lean();
  res.status(200).json(
    new ApiResponse(200, doc?.value || { minAmount: 500, schedule: "weekly", day: "friday", time: "17:00" })
  );
});

const updateSettings = asyncHandler(async (req, res) => {
  const { minAmount, schedule, day, time } = req.body;
  const value = { minAmount, schedule, day, time };

  const doc = await SystemSetting.findOneAndUpdate(
    { key: "payout" },
    { key: "payout", value, group: "payout", updatedBy: req.admin._id },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, doc.value, "Payout settings updated"));
});

const approve = asyncHandler(async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw new ApiError(404, "Payout not found");
  if (payout.status !== "pending") throw new ApiError(400, "Payout not pending");

  payout.status = "processing";
  payout.approvedBy = req.admin._id;
  await payout.save();

  res.status(200).json(new ApiResponse(200, payout, "Payout approved"));
});

const reject = asyncHandler(async (req, res) => {
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw new ApiError(404, "Payout not found");
  if (payout.status !== "pending") throw new ApiError(400, "Payout not pending");

  payout.status = "rejected";
  payout.failureReason = req.body.reason || "Rejected by admin";
  await payout.save();

  res.status(200).json(new ApiResponse(200, payout, "Payout rejected"));
});

export { list, getSettings, updateSettings, approve, reject };