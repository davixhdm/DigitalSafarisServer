import FoodOrder from "../../models/rest/FoodOrder.js";
import DeliveryJob from "../../models/trans/DeliveryJob.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { restaurant: req.partner._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    FoodOrder.find(filter)
      .populate("customer", "firstName lastName phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FoodOrder.countDocuments(filter),
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
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email avatar")
    .populate("deliveryJob")
    .lean();

  if (!order) throw new ApiError(404, "Order not found");

  res.status(200).json(new ApiResponse(200, order));
});

const accept = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "pending") throw new ApiError(400, "Order cannot be accepted");

  order.status = "accepted";
  order.acceptedAt = new Date();
  await order.save();

  if (order.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderAccepted(order.customer, {
      order,
      restaurant: req.partner,
      branding,
      settings,
    });
    await smsService.orderAccepted(order.customer, {
      reference: order.reference,
      restaurant: req.partner.name,
    });
  }

  socketService.emitToCustomer(order.customer._id.toString(), "order:accepted", {
    reference: order.reference,
  });

  res.status(200).json(new ApiResponse(200, order, "Order accepted"));
});

const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "pending") throw new ApiError(400, "Order cannot be rejected");

  order.status = "rejected";
  order.cancelledAt = new Date();
  order.cancelledBy = "restaurant";
  order.cancellationReason = reason || "Restaurant rejected";
  await order.save();

  if (order.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderCancelled(order.customer, {
      order,
      reason: order.cancellationReason,
      branding,
      settings,
    });
    await smsService.orderCancelled(order.customer, {
      reference: order.reference,
      reason: order.cancellationReason,
    });
  }

  socketService.emitToCustomer(order.customer._id.toString(), "order:cancelled", {
    reference: order.reference,
    reason: order.cancellationReason,
  });

  res.status(200).json(new ApiResponse(200, order, "Order rejected"));
});

const markPreparing = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "accepted") throw new ApiError(400, "Invalid state transition");

  order.status = "preparing";
  order.preparedAt = new Date();
  await order.save();

  if (order.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderPreparing(order.customer, { order, branding, settings });
  }

  res.status(200).json(new ApiResponse(200, order, "Preparing"));
});

const markReady = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "preparing") throw new ApiError(400, "Invalid state transition");

  order.status = "ready";
  await order.save();

  res.status(200).json(new ApiResponse(200, order, "Ready"));
});

const requestDsTransport = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "ready") throw new ApiError(400, "Order must be ready first");
  if (order.type !== "delivery") throw new ApiError(400, "Order is not a delivery");
  if (!order.deliveryAddress) throw new ApiError(400, "Missing delivery address");
  if (order.deliveryJob) throw new ApiError(400, "Transport already requested");

  const broadcast = await SystemSetting.findOne({ key: "broadcast" }).lean();
  const expirySeconds = broadcast?.value?.expirySeconds || 60;

  const job = await DeliveryJob.create({
    reference: `JOB-${Date.now().toString(36).toUpperCase()}`,
    order: order._id,
    restaurant: req.partner._id,
    customer: order.customer._id,
    pickup: {
      address: `${req.partner.name}, ${req.partner.address}`,
      town: req.partner.town,
      latitude: req.partner.latitude,
      longitude: req.partner.longitude,
    },
    dropoff: {
      address: order.deliveryAddress.address,
      town: order.deliveryAddress.town,
      latitude: order.deliveryAddress.latitude,
      longitude: order.deliveryAddress.longitude,
    },
    distanceKm: 0,
    fee: order.deliveryFee || 0,
    commissionRate: 10,
    commissionAmount: (order.deliveryFee || 0) * 0.1,
    partnerEarnings: (order.deliveryFee || 0) * 0.9,
    currency: order.currency || "KES",
    status: "broadcasting",
    broadcastExpiresAt: new Date(Date.now() + expirySeconds * 1000),
  });

  order.deliveryMethod = "ds_transport";
  order.deliveryJob = job._id;
  await order.save();

  socketService.broadcastDeliveryJob(job.toObject());

  res.status(200).json(new ApiResponse(200, job, "Transport requested"));
});

const markManualDelivery = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "ready") throw new ApiError(400, "Order must be ready first");
  if (order.type !== "delivery") throw new ApiError(400, "Order is not a delivery");

  order.deliveryMethod = "manual";
  order.status = "out_for_delivery";
  order.outForDeliveryAt = new Date();
  await order.save();

  if (order.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderOutForDelivery(order.customer, {
      order,
      driver: null,
      branding,
      settings,
    });
  }

  socketService.emitToCustomer(order.customer._id.toString(), "order:out_for_delivery", {
    reference: order.reference,
  });

  res.status(200).json(new ApiResponse(200, order, "Out for delivery"));
});

const markDelivered = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!order) throw new ApiError(404, "Order not found");
  if (!["out_for_delivery", "ready"].includes(order.status)) {
    throw new ApiError(400, "Order cannot be delivered");
  }

  order.status = "delivered";
  order.deliveredAt = new Date();
  if (order.type === "delivery") order.status = "completed";
  order.completedAt = new Date();
  await order.save();

  if (order.customer) {
    const { branding, settings } = await getContext();
    await emailService.deliveryReceipt(order.customer, {
      order,
      branding,
      settings,
    });
    await smsService.orderDelivered(order.customer, {
      reference: order.reference,
    });
  }

  socketService.emitToCustomer(order.customer._id.toString(), "order:delivered", {
    reference: order.reference,
  });

  res.status(200).json(new ApiResponse(200, order, "Delivered"));
});

export {
  list,
  details,
  accept,
  reject,
  markPreparing,
  markReady,
  requestDsTransport,
  markManualDelivery,
  markDelivered,
};