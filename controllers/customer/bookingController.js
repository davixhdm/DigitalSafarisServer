import mongoose from "mongoose";
import Booking from "../../models/accom/Booking.js";
import Room from "../../models/accom/Room.js";
import Property from "../../models/accom/Property.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import generateOTP from "../../utils/generateOTP.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { accommodation: 10 },
  };
};

const create = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, roomsBooked, guests, paymentMethod, specialRequests } = req.body;

  const room = await Room.findById(roomId).populate("property");
  if (!room) throw new ApiError(404, "Room not found");
  if (room.status !== "active") throw new ApiError(400, "Room not available");

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw new ApiError(400, "Invalid dates");

  const availableUnits = await RoomAvailability.aggregate([
    {
      $match: {
        room: room._id,
        date: { $gte: inDate, $lt: outDate },
      },
    },
    { $group: { _id: null, min: { $min: "$availableUnits" } } },
  ]);

  const minAvailable = availableUnits[0]?.min ?? room.totalUnits;
  if (minAvailable < roomsBooked) throw new ApiError(400, "Not enough units available");

  const pricePerNight = room.basePrice;
  const subtotal = pricePerNight * nights * roomsBooked;
  const { commission } = await getContext();
  const commissionRate = commission.accommodation || 10;
  const commissionAmount = (subtotal * commissionRate) / 100;
  const total = subtotal;

  const booking = await Booking.create({
    reference: generateRef("BKG"),
    customer: req.customer._id,
    partner: room.partner,
    property: room.property._id,
    room: room._id,
    checkIn: inDate,
    checkOut: outDate,
    nights,
    guests,
    roomsBooked,
    pricePerNight,
    subtotal,
    total,
    currency: "KES",
    commissionRate,
    commissionAmount,
    partnerEarnings: subtotal - commissionAmount,
    paymentMethod,
    specialRequests: specialRequests || null,
    status: "pending",
    paymentStatus: "pending",
    qrCode: generateRef("QR"),
  });

  if (paymentMethod === "wallet") {
    const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    if (wallet.balance < total) throw new ApiError(400, "Insufficient wallet balance");

    wallet.balance -= total;
    wallet.totalDebited += total;
    await wallet.save();

    await CustomerPayment.create({
      customer: req.customer._id,
      reference: generateRef("PAY"),
      method: "wallet",
      purpose: "booking",
      relatedId: booking._id,
      amount: total,
      status: "success",
    });

    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.confirmedAt = new Date();
    await booking.save();
  }

  const { branding, settings } = await getContext();
  if (booking.status === "confirmed") {
    await emailService.bookingConfirmation(req.customer, {
      booking,
      property: room.property,
      branding,
      settings,
    });
    await smsService.bookingConfirmation(req.customer, {
      reference: booking.reference,
      checkIn: new Date(booking.checkIn).toDateString(),
    });
  }

  res.status(201).json(new ApiResponse(201, booking, "Booking created"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("property", "name images town address")
      .populate("room", "name type basePrice images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.customer._id })
    .populate("property")
    .populate("room")
    .populate("partner", "name email phone town");
  if (!booking) throw new ApiError(404, "Booking not found");
  res.status(200).json(new ApiResponse(200, booking));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (["cancelled", "checked_out"].includes(booking.status)) throw new ApiError(400, "Cannot cancel");

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "customer";
  booking.cancellationReason = reason || "Customer requested";
  await booking.save();

  const { branding, settings } = await getContext();
  await emailService.bookingCancelled(req.customer, { booking, reason, branding, settings });
  await smsService.bookingCancelled(req.customer, { reference: booking.reference, reason });

  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
});

const checkIn = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.customer._id }).populate("property");
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") throw new ApiError(400, "Booking not confirmed");

  booking.status = "checked_in";
  booking.checkedInAt = new Date();
  await booking.save();

  const { branding, settings } = await getContext();
  await emailService.checkInConfirmation(req.customer, { booking, property: booking.property, branding, settings });
  await smsService.checkInConfirmation(req.customer, { property: booking.property.name });

  res.status(200).json(new ApiResponse(200, booking, "Checked in"));
});

export { create, list, details, cancel, checkIn };