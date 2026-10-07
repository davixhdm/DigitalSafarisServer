import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import Payout from "../../models/admin/Payout.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const wallet = await AccommodationWallet.findOne({ partner: req.partner._id }).lean();
  if (!wallet) throw new ApiError(404, "Wallet not found");
  res.status(200).json(new ApiResponse(200, wallet));
});

const transactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Payout.find({ partner: req.partner._id, partnerType: "accommodation" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Payout.countDocuments({ partner: req.partner._id, partnerType: "accommodation" }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const updatePayoutDetails = asyncHandler(async (req, res) => {
  const { payoutMethod, payoutDetails, payoutFrequency, minimumPayout } = req.body;

  const updates = {};
  if (payoutMethod) updates.payoutMethod = payoutMethod;
  if (payoutDetails) updates.payoutDetails = payoutDetails;
  if (payoutFrequency) updates.payoutFrequency = payoutFrequency;
  if (typeof minimumPayout === "number") updates.minimumPayout = minimumPayout;

  const wallet = await AccommodationWallet.findOneAndUpdate(
    { partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!wallet) throw new ApiError(404, "Wallet not found");

  res.status(200).json(new ApiResponse(200, wallet, "Payout details updated"));
});

export { get, transactions, updatePayoutDetails };