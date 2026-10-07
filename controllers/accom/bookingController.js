import Booking from "../../models/accom/Booking.js";
import Guest from "../../models/accom/Guest.js";
import Property from "../../models/accom/Property.js";
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
    Booking.find(filter)
      .populate("customer", "firstName lastName phone email")
      .populate("property", "name town address")
      .populate("room", "name type basePrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(filter),
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
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email avatar")
    .populate("property")
    .populate("room")
    .lean();

  if (!booking) throw new ApiError(404, "Booking not found");

  const guests = await Guest.find({ booking: booking._id }).lean();

  res.status(200).json(new ApiResponse(200, { booking, guests }));
});

const confirm = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer").populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") throw new ApiError(400, "Booking cannot be confirmed");

  booking.status = "confirmed";
  booking.confirmedAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.bookingConfirmation(booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    await smsService.bookingConfirmation(booking.customer, {
      reference: booking.reference,
      checkIn: new Date(booking.checkIn).toDateString(),
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "booking:confirmed", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Booking confirmed"));
});

const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") throw new ApiError(400, "Booking cannot be rejected");

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "partner";
  booking.cancellationReason = reason || "Partner rejected";
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.bookingCancelled(booking.customer, {
      booking,
      reason: booking.cancellationReason,
      branding,
      settings,
    });
    await smsService.bookingCancelled(booking.customer, {
      reference: booking.reference,
      reason: booking.cancellationReason,
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "booking:cancelled", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Booking rejected"));
});

const checkIn = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer").populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") throw new ApiError(400, "Booking cannot be checked in");

  booking.status = "checked_in";
  booking.checkedInAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.checkInConfirmation(booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    await smsService.checkInConfirmation(booking.customer, {
      property: booking.property.name,
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "booking:checked_in", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Checked in"));
});

const checkOut = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer").populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "checked_in") throw new ApiError(400, "Booking cannot be checked out");

  booking.status = "checked_out";
  booking.checkedOutAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    await emailService.checkOutConfirmation(booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    await smsService.checkOutConfirmation(booking.customer, {
      property: booking.property.name,
    });
  }

  socketService.emitToCustomer(booking.customer._id.toString(), "booking:checked_out", {
    reference: booking.reference,
  });

  res.status(200).json(new ApiResponse(200, booking, "Checked out"));
});

const markNoShow = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") throw new ApiError(400, "Booking cannot be marked no-show");

  booking.status = "no_show";
  await booking.save();

  res.status(200).json(new ApiResponse(200, booking, "Marked no-show"));
});

export { list, details, confirm, reject, checkIn, checkOut, markNoShow };