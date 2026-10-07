import Dispute from "../../models/admin/Dispute.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Dispute.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Dispute.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id).lean();
  if (!dispute) throw new ApiError(404, "Dispute not found");
  res.status(200).json(new ApiResponse(200, dispute));
});

const assign = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new ApiError(404, "Dispute not found");

  dispute.assignedTo = req.body.adminId || req.admin._id;
  dispute.status = "investigating";
  await dispute.save();

  res.status(200).json(new ApiResponse(200, dispute, "Dispute assigned"));
});

const resolve = asyncHandler(async (req, res) => {
  const { resolution, refundAmount } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new ApiError(404, "Dispute not found");

  dispute.status = "resolved";
  dispute.resolution = resolution || "Resolved";
  dispute.refundAmount = refundAmount || 0;
  dispute.resolvedBy = req.admin._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  res.status(200).json(new ApiResponse(200, dispute, "Dispute resolved"));
});

const reject = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new ApiError(404, "Dispute not found");

  dispute.status = "rejected";
  dispute.resolution = req.body.reason || "Rejected";
  dispute.resolvedBy = req.admin._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  res.status(200).json(new ApiResponse(200, dispute, "Dispute rejected"));
});

export { list, details, assign, resolve, reject };