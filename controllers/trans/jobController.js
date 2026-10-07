import DeliveryJob from "../../models/trans/DeliveryJob.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import Vehicle from "../../models/trans/Vehicle.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import Customer from "../../models/customer/Customer.js";
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

const available = asyncHandler(async (req, res) => {
  const now = new Date();

  const items = await DeliveryJob.find({
    status: "broadcasting",
    broadcastExpiresAt: { $gt: now },
  })
    .populate("restaurant", "name address town latitude longitude")
    .populate("customer", "firstName lastName")
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, items));
});

const mine = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    DeliveryJob.find(filter)
      .populate("restaurant", "name address town")
      .populate("customer", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    DeliveryJob.countDocuments(filter),
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
  const job = await DeliveryJob.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("restaurant")
    .populate("customer")
    .populate("vehicle")
    .lean();

  if (!job) throw new ApiError(404, "Job not found");

  res.status(200).json(new ApiResponse(200, job));
});

const accept = asyncHandler(async (req, res) => {
  const now = new Date();

  const job = await DeliveryJob.findOne({
    _id: req.params.id,
    status: "broadcasting",
    broadcastExpiresAt: { $gt: now },
  })
    .populate("restaurant")
    .populate("customer");

  if (!job) throw new ApiError(404, "Job not available");

  const vehicle = await Vehicle.findOne({
    partner: req.partner._id,
    status: "active",
  });

  if (!vehicle) throw new ApiError(400, "No active vehicle available");

  job.status = "accepted";
  job.partner = req.partner._id;
  job.vehicle = vehicle._id;
  job.acceptedAt = new Date();
  await job.save();

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    {
      $set: {
        partner: req.partner._id,
        isOnline: true,
        isAvailable: false,
        activeDelivery: job._id,
        lastPingAt: new Date(),
      },
    },
    { upsert: true }
  );

  if (job.customer) {
    socketService.emitToCustomer(job.customer._id.toString(), "delivery:accepted", {
      reference: job.reference,
      driverName: `${req.partner.firstName} ${req.partner.lastName}`,
      driverPhone: req.partner.phone,
    });
  }

  res.status(200).json(new ApiResponse(200, job, "Delivery accepted"));
});

const pickedUp = asyncHandler(async (req, res) => {
  const job = await DeliveryJob.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("restaurant");

  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "accepted") throw new ApiError(400, "Job not accepted yet");

  job.status = "picked_up";
  job.pickedUpAt = new Date();
  await job.save();

  const order = await FoodOrder.findById(job.order);
  if (order) {
    order.status = "out_for_delivery";
    order.outForDeliveryAt = new Date();
    await order.save();
  }

  if (job.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderOutForDelivery(job.customer, {
      order,
      driver: req.partner,
      branding,
      settings,
    });
    await smsService.orderOutForDelivery(job.customer, {
      reference: job.reference,
      driverName: `${req.partner.firstName} ${req.partner.lastName}`,
      driverPhone: req.partner.phone,
    });
  }

  res.status(200).json(new ApiResponse(200, job, "Marked picked up"));
});

const delivered = asyncHandler(async (req, res) => {
  const job = await DeliveryJob.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("restaurant");

  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "picked_up") throw new ApiError(400, "Job not picked up");

  job.status = "delivered";
  job.deliveredAt = new Date();
  await job.save();

  const order = await FoodOrder.findById(job.order);
  if (order) {
    order.status = "completed";
    order.deliveredAt = new Date();
    order.completedAt = new Date();
    await order.save();
  }

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    {
      $set: {
        isAvailable: true,
        activeDelivery: null,
        lastPingAt: new Date(),
      },
    }
  );

  if (job.customer) {
    const { branding, settings } = await getContext();
    await emailService.orderDelivered(job.customer, {
      order,
      branding,
      settings,
    });
    await smsService.orderDelivered(job.customer, { reference: job.reference });
  }

  res.status(200).json(new ApiResponse(200, job, "Delivered"));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const job = await DeliveryJob.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!job) throw new ApiError(404, "Job not found");
  if (!["accepted", "picked_up"].includes(job.status)) {
    throw new ApiError(400, "Job cannot be cancelled");
  }

  job.status = "cancelled";
  job.cancelledBy = "partner";
  job.cancellationReason = reason || "Driver cancelled";
  await job.save();

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    { $set: { isAvailable: true, activeDelivery: null } }
  );

  const restaurant = await RestaurantPartner.findById(job.restaurant);
  if (restaurant) {
    socketService.emitToRestaurant(restaurant._id.toString(), "delivery:cancelled", {
      reference: job.reference,
    });
  }

  res.status(200).json(new ApiResponse(200, job, "Job cancelled"));
});

export { available, mine, details, accept, pickedUp, delivered, cancel };