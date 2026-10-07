import BroadcastRequest from "../../models/rest/BroadcastRequest.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as socketService from "../../services/socketService.js";
import * as cacheService from "../../services/cacheService.js";
import calculateDistance from "../../utils/calculateDistance.js";
import { generateRef } from "../../utils/helpers.js";

const getSettings = async () => {
  const broadcast = await SystemSetting.findOne({ key: "broadcast" }).lean();
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return {
    broadcast: broadcast?.value || { radiusKm: 5, expirySeconds: 60 },
    settings: general?.value || {},
  };
};

const create = asyncHandler(async (req, res) => {
  const {
    foodType, preparation, timeNeeded, budget,
    deliveryAddress, locationId, notes,
  } = req.body;

  const { broadcast, settings } = await getSettings();

  const restaurants = await RestaurantPartner.find({
    status: "active",
    isDeleted: false,
    isAcceptingOrders: true,
    town: new RegExp(deliveryAddress.town, "i"),
  }).select("_id name email latitude longitude");

  const nearby = restaurants.filter((r) => {
    if (!r.latitude || !r.longitude) return true;
    const dist = calculateDistance(
      deliveryAddress.latitude,
      deliveryAddress.longitude,
      r.latitude,
      r.longitude
    );
    return dist <= broadcast.radiusKm;
  });

  const request = await BroadcastRequest.create({
    reference: generateRef("BRD"),
    customer: req.customer._id,
    foodType,
    preparation,
    timeNeeded,
    budget,
    currency: "KES",
    deliveryAddress,
    location: locationId,
    broadcastRadiusKm: broadcast.radiusKm,
    broadcastExpiresAt: new Date(Date.now() + broadcast.expirySeconds * 1000),
    targetedRestaurants: nearby.map((r) => r._id),
    status: "broadcasting",
    notes: notes || null,
  });

  const restaurantIds = nearby.map((r) => r._id.toString());
  socketService.broadcastFoodRequest(request.toObject(), restaurantIds);

  for (const r of nearby) {
    await emailService.newBroadcastReceived(r, { request, settings });
  }

  await cacheService.setCache(
    `broadcast:${request.reference}`,
    { restaurantIds, customerId: req.customer._id.toString() },
    broadcast.expirySeconds + 60
  );

  res.status(201).json(new ApiResponse(201, request, "Broadcast sent"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    BroadcastRequest.find(filter)
      .populate("acceptedBy", "name logo town")
      .populate("order")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    BroadcastRequest.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const request = await BroadcastRequest.findOne({ _id: req.params.id, customer: req.customer._id })
    .populate("acceptedBy", "name logo town address phone")
    .populate("order");
  if (!request) throw new ApiError(404, "Broadcast not found");
  res.status(200).json(new ApiResponse(200, request));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const request = await BroadcastRequest.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!request) throw new ApiError(404, "Broadcast not found");
  if (request.status !== "broadcasting") throw new ApiError(400, "Cannot cancel");

  request.status = "cancelled";
  request.cancelledAt = new Date();
  request.cancelledBy = "customer";
  request.cancellationReason = reason || "Customer requested";
  await request.save();

  const cached = await cacheService.getCache(`broadcast:${request.reference}`);
  if (cached?.restaurantIds) {
    socketService.cancelBroadcast(request.reference, cached.restaurantIds);
  }

  await cacheService.deleteCache(`broadcast:${request.reference}`);

  res.status(200).json(new ApiResponse(200, request, "Broadcast cancelled"));
});

export { create, list, details, cancel };