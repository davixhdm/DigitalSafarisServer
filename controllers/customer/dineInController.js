import DineInBooking from "../../models/rest/DineInBooking.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import MenuItem from "../../models/rest/MenuItem.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return { branding, settings: general?.value || {}, commission: commission?.value || { food: 10 } };
};

const create = asyncHandler(async (req, res) => {
  const { restaurantId, type, scheduledAt, partySize, preOrder, notes } = req.body;

  const restaurant = await RestaurantPartner.findById(restaurantId);
  if (!restaurant) throw new ApiError(404, "Restaurant not found");
  if (restaurant.status !== "active") throw new ApiError(400, "Restaurant not available");

  let items = [];
  let estimatedTotal = 0;

  if (preOrder && preOrder.length > 0) {
    const ids = preOrder.map((i) => i.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: ids }, restaurant: restaurantId });

    items = preOrder.map((i) => {
      const mi = menuItems.find((m) => m._id.toString() === i.menuItem);
      if (!mi) throw new ApiError(400, "Invalid menu item");
      const price = mi.discountPrice ?? mi.price;
      return {
        menuItem: mi._id,
        name: mi.name,
        price,
        quantity: i.quantity,
        subtotal: price * i.quantity,
        notes: i.notes || null,
      };
    });

    estimatedTotal = items.reduce((s, i) => s + i.subtotal, 0);
  }

  const { commission } = await getContext();
  const commissionRate = commission.food || 10;
  const commissionAmount = (estimatedTotal * commissionRate) / 100;

  const booking = await DineInBooking.create({
    reference: generateRef("DNB"),
    customer: req.customer._id,
    restaurant: restaurantId,
    type,
    scheduledAt,
    partySize,
    preOrder: items,
    estimatedTotal,
    commissionRate,
    commissionAmount,
    restaurantEarnings: estimatedTotal - commissionAmount,
    customerNotes: notes || null,
    status: "pending",
  });

  socketService.emitToRestaurant(restaurantId, "dinein:new", {
    reference: booking.reference,
    scheduledAt: booking.scheduledAt,
    partySize: booking.partySize,
  });

  const { branding, settings } = await getContext();
  await emailService.dineInBookingConfirmation(req.customer, { booking, restaurant, branding, settings });
  await smsService.dineInBookingConfirmation(req.customer, {
    reference: booking.reference,
    restaurant: restaurant.name,
    scheduledAt: new Date(booking.scheduledAt).toLocaleString(),
  });

  res.status(201).json(new ApiResponse(201, booking, "Booking placed"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    DineInBooking.find(filter)
      .populate("restaurant", "name logo town address")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    DineInBooking.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const booking = await DineInBooking.findOne({ _id: req.params.id, customer: req.customer._id })
    .populate("restaurant");
  if (!booking) throw new ApiError(404, "Booking not found");
  res.status(200).json(new ApiResponse(200, booking));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await DineInBooking.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (["completed", "cancelled"].includes(booking.status)) throw new ApiError(400, "Cannot cancel");

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "customer";
  booking.cancellationReason = reason || "Customer requested";
  await booking.save();

  socketService.emitToRestaurant(booking.restaurant.toString(), "dinein:cancelled", {
    reference: booking.reference,
  });

  const { branding, settings } = await getContext();
  await emailService.dineInCancelled(req.customer, { booking, reason, branding, settings });
  await smsService.dineInCancelled(req.customer, { reference: booking.reference, reason });

  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
});

export { create, list, details, cancel };