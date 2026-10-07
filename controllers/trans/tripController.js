import Trip from "../../models/trans/Trip.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import Vehicle from "../../models/trans/Vehicle.js";
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

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Trip.find(filter)
      .populate("customer", "firstName lastName phone email")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Trip.countDocuments(filter),
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
  const trip = await Trip.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email avatar")
    .populate("vehicle")
    .lean();

  if (!trip) throw new ApiError(404, "Trip not found");

  res.status(200).json(new ApiResponse(200, trip));
});

const start = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer");

  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.status !== "accepted") throw new ApiError(400, "Trip cannot be started");

  trip.status = "ongoing";
  trip.startedAt = new Date();
  await trip.save();

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    { $set: { isAvailable: false, activeTrip: trip._id } }
  );

  if (trip.customer) {
    const { branding, settings } = await getContext();
    await emailService.tripStarted(trip.customer, { trip, branding, settings });
    await smsService.tripStarted(trip.customer, { reference: trip.reference });
  }

  socketService.emitToCustomer(trip.customer._id.toString(), "trip:started", {
    reference: trip.reference,
  });

  res.status(200).json(new ApiResponse(200, trip, "Trip started"));
});

const complete = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer");

  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.status !== "ongoing") throw new ApiError(400, "Trip not ongoing");

  trip.status = "completed";
  trip.completedAt = new Date();
  await trip.save();

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    { $set: { isAvailable: true, activeTrip: null } }
  );

  if (trip.customer) {
    const { branding, settings } = await getContext();
    await emailService.tripCompleted(trip.customer, { trip, branding, settings });
    await smsService.tripCompleted(trip.customer, {
      reference: trip.reference,
      fare: `${trip.currency} ${trip.fare}`,
    });
  }

  socketService.emitToCustomer(trip.customer._id.toString(), "trip:completed", {
    reference: trip.reference,
  });

  res.status(200).json(new ApiResponse(200, trip, "Trip completed"));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const trip = await Trip.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer");

  if (!trip) throw new ApiError(404, "Trip not found");
  if (["completed", "cancelled"].includes(trip.status)) {
    throw new ApiError(400, "Trip cannot be cancelled");
  }

  trip.status = "cancelled";
  trip.cancelledBy = "partner";
  trip.cancellationReason = reason || "Driver cancelled";
  await trip.save();

  await DriverLocation.updateOne(
    { partner: req.partner._id },
    { $set: { isAvailable: true, activeTrip: null } }
  );

  if (trip.customer) {
    const { branding, settings } = await getContext();
    await emailService.tripCancelled(trip.customer, {
      trip,
      reason: trip.cancellationReason,
      branding,
      settings,
    });
    await smsService.tripCancelled(trip.customer, {
      reference: trip.reference,
      reason: trip.cancellationReason,
    });
  }

  socketService.emitToCustomer(trip.customer._id.toString(), "trip:cancelled", {
    reference: trip.reference,
  });

  res.status(200).json(new ApiResponse(200, trip, "Trip cancelled"));
});

export { list, details, start, complete, cancel };