import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Commission from "../../models/admin/Commission.js";
import Payout from "../../models/admin/Payout.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const revenue = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const [food, transport, accommodation, total] = await Promise.all([
    Commission.aggregate([{ $match: { ...match, type: "food" } }, { $group: { _id: null, sum: { $sum: "$commissionAmount" } } }]),
    Commission.aggregate([{ $match: { ...match, type: "transport" } }, { $group: { _id: null, sum: { $sum: "$commissionAmount" } } }]),
    Commission.aggregate([{ $match: { ...match, type: "accommodation" } }, { $group: { _id: null, sum: { $sum: "$commissionAmount" } } }]),
    Commission.aggregate([{ $match: match }, { $group: { _id: null, sum: { $sum: "$commissionAmount" } } }]),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      food: food[0]?.sum || 0,
      transport: transport[0]?.sum || 0,
      accommodation: accommodation[0]?.sum || 0,
      total: total[0]?.sum || 0,
      currency: "KES",
    })
  );
});

const payouts = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: "completed" };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const summary = await Payout.aggregate([
    { $match: match },
    { $group: { _id: "$partnerType", sum: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  res.status(200).json(new ApiResponse(200, { summary, currency: "KES" }));
});

const payments = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: "success" };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const summary = await CustomerPayment.aggregate([
    { $match: match },
    { $group: { _id: "$method", sum: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  res.status(200).json(new ApiResponse(200, { summary, currency: "KES" }));
});

export { revenue, payouts, payments };