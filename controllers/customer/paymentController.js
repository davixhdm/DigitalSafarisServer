import CustomerPayment from "../../models/customer/CustomerPayment.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { method, status, purpose, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (method) filter.method = method;
  if (status) filter.status = status;
  if (purpose) filter.purpose = purpose;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerPayment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    CustomerPayment.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findOne({ _id: req.params.id, customer: req.customer._id }).lean();
  if (!payment) throw new ApiError(404, "Payment not found");
  res.status(200).json(new ApiResponse(200, payment));
});

const walletBalance = asyncHandler(async (req, res) => {
  const wallet = await CustomerWallet.findOne({ customer: req.customer._id }).lean();
  if (!wallet) throw new ApiError(404, "Wallet not found");
  res.status(200).json(new ApiResponse(200, wallet));
});

const walletTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerPayment.find({ customer: req.customer._id, method: "wallet" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerPayment.countDocuments({ customer: req.customer._id, method: "wallet" }),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

export { list, details, walletBalance, walletTransactions };