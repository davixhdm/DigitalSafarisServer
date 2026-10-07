import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const models = {
  restaurant: RestaurantWallet,
  transport: TransportWallet,
  accommodation: AccommodationWallet,
};

const partnerFields = {
  restaurant: "restaurant",
  transport: "partner",
  accommodation: "partner",
};

const list = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;

  if (!type || !models[type]) {
    return res.status(200).json(
      new ApiResponse(200, {
        items: [],
        total: 0,
        page: 1,
        limit: Number(limit),
        totalPages: 1,
      })
    );
  }

  const Model = models[type];
  const field = partnerFields[type];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Model.find()
      .populate(field, "name firstName lastName email type town")
      .sort({ balance: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Model.countDocuments(),
  ]);

  const data = items.map((w) => {
    const partner = w[field];
    const name =
      partner?.name ||
      (partner ? `${partner.firstName ?? ""} ${partner.lastName ?? ""}`.trim() : "—");

    return {
      _id: w._id,
      partnerId: partner?._id ?? null,
      partnerName: name || "—",
      partnerType: type,
      balance: w.balance ?? 0,
      totalEarned: w.totalEarned ?? 0,
      commissionOwed: w.totalCommissionOwed ?? 0,
      currency: w.currency ?? "KES",
      lastPayoutAt: w.lastPayoutAt ?? null,
      updatedAt: w.updatedAt,
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  if (!models[type]) throw new ApiError(400, "Invalid wallet type");

  const Model = models[type];
  const field = partnerFields[type];

  const w = await Model.findById(id)
    .populate(field, "name firstName lastName email phone type town")
    .lean();

  if (!w) throw new ApiError(404, "Wallet not found");

  const partner = w[field];
  const name =
    partner?.name ||
    (partner ? `${partner.firstName ?? ""} ${partner.lastName ?? ""}`.trim() : "—");

  const wallet = {
    _id: w._id,
    partnerId: partner?._id ?? null,
    partnerName: name || "—",
    partnerType: type,
    balance: w.balance ?? 0,
    totalEarned: w.totalEarned ?? 0,
    commissionOwed: w.totalCommissionOwed ?? 0,
    currency: w.currency ?? "KES",
    lastPayoutAt: w.lastPayoutAt ?? null,
    updatedAt: w.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { wallet }));
});

const transactions = asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!models[type]) throw new ApiError(400, "Invalid wallet type");

  res.status(200).json(
    new ApiResponse(200, {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  );
});

export { list, details, transactions };