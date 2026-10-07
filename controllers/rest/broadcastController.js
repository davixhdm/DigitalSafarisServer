import BroadcastRequest from "../../models/rest/BroadcastRequest.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as socketService from "../../services/socketService.js";
import * as cacheService from "../../services/cacheService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { byService: { food: 10 } },
  };
};

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {
    targetedRestaurants: req.partner._id,
  };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    BroadcastRequest.find(filter)
      .populate("customer", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    BroadcastRequest.countDocuments(filter),
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

const details = asyncHandler(async (req, res) => {
  const request = await BroadcastRequest.findOne({
    _id: req.params.id,
    targetedRestaurants: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email")
    .lean();

  if (!request) throw new ApiError(404, "Broadcast not found");

  res.status(200).json(new ApiResponse(200, request));
});

const accept = asyncHandler(async (req, res) => {
  const request = await BroadcastRequest.findById(req.params.id).populate("customer");

  if (!request) throw new ApiError(404, "Broadcast not found");
  if (request.status !== "broadcasting") throw new ApiError(400, "Broadcast already taken");
  if (!request.targetedRestaurants.some((id) => id.toString() === req.partner._id.toString())) {
    throw new ApiError(403, "Not a target for this broadcast");
  }
  if (new Date(request.broadcastExpiresAt) < new Date()) {
    throw new ApiError(400, "Broadcast expired");
  }

  const { commission } = await getContext();
  const rate = commission?.byService?.food ?? 10;
  const estimatedTotal = request.budget;
  const commissionAmount = (estimatedTotal * rate) / 100;

  request.status = "accepted";
  request.acceptedBy = req.partner._id;
  request.acceptedAt = new Date();
  await request.save();

  const order = await FoodOrder.create({
    reference: generateRef("ORD"),
    customer: request.customer._id,
    restaurant: req.partner._id,
    type: "delivery",
    items: [],
    subtotal: estimatedTotal,
    deliveryFee: 0,
    total: estimatedTotal,
    currency: request.currency,
    commissionRate: rate,
    commissionAmount,
    restaurantEarnings: estimatedTotal - commissionAmount,
    paymentMethod: "wallet",
    deliveryAddress: request.deliveryAddress,
    customerNotes: request.preparation,
    status: "accepted",
    paymentStatus: "pending",
    orderType: "broadcast",
    broadcastRequest: request._id,
    acceptedAt: new Date(),
  });

  request.order = order._id;
  await request.save();

  const cached = await cacheService.getCache(`broadcast:${request.reference}`);
  const targets = cached?.restaurantIds || request.targetedRestaurants.map((id) => id.toString());
  socketService.lockBroadcast(request.reference, targets, req.partner.name);
  await cacheService.deleteCache(`broadcast:${request.reference}`);

  if (request.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderAccepted(request.customer, {
      order,
      restaurant: req.partner,
      branding,
      settings,
    });
  }

  res.status(200).json(new ApiResponse(200, { request, order }, "Broadcast accepted"));
});

export { list, details, accept };