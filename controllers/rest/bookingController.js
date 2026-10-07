import DineInBooking from "../../models/rest/DineInBooking.js";
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
    DineInBooking.find(filter)
      .populate("customer", "firstName lastName phone email")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    DineInBooking.countDocuments(filter),
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
  const booking = await DineInBooking.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email avatar")
    .lean();

  if (!booking) throw new ApiError(404, "Booking not found");

  res.status(200).json(new ApiResponse(200, booking));
});

const accept = asyncHandler(async (req, res) => {
  const booking = await DineInBooking.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") throw new ApiError(400, "Booking cannot be accepted");

  booking.status = "accepted";
  booking.acceptedAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.dineInAccepted(booking.customer, {
      booking,
      restaurant: req.partner,
      branding,
      settings,
    });
    await smsService.dineInAccepted(booking.customer, {
      reference: booking.reference,
      restaurant: req.partner.name,
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "dinein:accepted", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Booking accepted"));
});

const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await DineInBooking.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  }).populate("customer");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") throw new ApiError(400, "Booking cannot be rejected");

  booking.status = "rejected";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "restaurant";
  booking.cancellationReason = reason || "Restaurant rejected";
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.dineInCancelled(booking.customer, {
      booking,
      reason: booking.cancellationReason,
      branding,
      settings,
    });
    await smsService.dineInCancelled(booking.customer, {
      reference: booking.reference,
      reason: booking.cancellationReason,
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "dinein:cancelled", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Booking rejected"));
});

const complete = asyncHandler(async (req, res) => {
  const booking = await DineInBooking.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  });

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "accepted") throw new ApiError(400, "Booking cannot be completed");

  booking.status = "completed";
  booking.completedAt = new Date();
  await booking.save();

  res.status(200).json(new ApiResponse(200, booking, "Booking completed"));
});

const markNoShow = asyncHandler(async (req, res) => {
  const booking = await DineInBooking.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  });

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "accepted") throw new ApiError(400, "Booking cannot be marked no-show");

  booking.status = "no_show";
  await booking.save();

  res.status(200).json(new ApiResponse(200, booking, "Marked no-show"));
});

export { list, details, accept, reject, complete, markNoShow };