import Booking from "../../models/accom/Booking.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Trip from "../../models/trans/Trip.js";
import BroadcastRequest from "../../models/rest/BroadcastRequest.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const buildPagination = (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const bookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = buildPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.reference = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("customer", "firstName lastName email phone")
      .populate("partner", "name type town")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const data = items.map((b) => ({
    _id: b._id,
    reference: b.reference,
    customerId: b.customer?._id ?? null,
    customerName: b.customer
      ? `${b.customer.firstName} ${b.customer.lastName}`
      : "—",
    partnerId: b.partner?._id ?? null,
    partnerName: b.partner?.name ?? "—",
    partnerType: b.partner?.type ?? "accommodation",
    status: b.status,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests?.adults ?? 0,
    total: b.total,
    currency: b.currency ?? "KES",
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  );
});

const bookingDetails = asyncHandler(async (req, res) => {
  const b = await Booking.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .populate("partner", "name type town email phone")
    .lean();

  if (!b) throw new ApiError(404, "Booking not found");

  const booking = {
    _id: b._id,
    reference: b.reference,
    customerId: b.customer?._id ?? null,
    customerName: b.customer
      ? `${b.customer.firstName} ${b.customer.lastName}`
      : "—",
    partnerId: b.partner?._id ?? null,
    partnerName: b.partner?.name ?? "—",
    partnerType: b.partner?.type ?? "accommodation",
    status: b.status,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests?.adults ?? 0,
    total: b.total,
    currency: b.currency ?? "KES",
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { booking }));
});

const orders = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = buildPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.reference = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    FoodOrder.find(filter)
      .populate("customer", "firstName lastName email phone")
      .populate("restaurant", "name town")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FoodOrder.countDocuments(filter),
  ]);

  const data = items.map((o) => ({
    _id: o._id,
    reference: o.reference,
    customerId: o.customer?._id ?? null,
    customerName: o.customer
      ? `${o.customer.firstName} ${o.customer.lastName}`
      : "—",
    partnerId: o.restaurant?._id ?? null,
    partnerName: o.restaurant?.name ?? "—",
    status: o.status,
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      total: i.subtotal,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    currency: o.currency ?? "KES",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  );
});

const orderDetails = asyncHandler(async (req, res) => {
  const o = await FoodOrder.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .populate("restaurant", "name town email phone")
    .lean();

  if (!o) throw new ApiError(404, "Order not found");

  const order = {
    _id: o._id,
    reference: o.reference,
    customerId: o.customer?._id ?? null,
    customerName: o.customer
      ? `${o.customer.firstName} ${o.customer.lastName}`
      : "—",
    partnerId: o.restaurant?._id ?? null,
    partnerName: o.restaurant?.name ?? "—",
    status: o.status,
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      total: i.subtotal,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    currency: o.currency ?? "KES",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { order }));
});

const trips = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = buildPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.reference = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    Trip.find(filter)
      .populate("customer", "firstName lastName email phone")
      .populate("partner", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Trip.countDocuments(filter),
  ]);

  const data = items.map((t) => ({
    _id: t._id,
    reference: t.reference,
    customerId: t.customer?._id ?? null,
    customerName: t.customer
      ? `${t.customer.firstName} ${t.customer.lastName}`
      : "—",
    partnerId: t.partner?._id ?? null,
    partnerName: t.partner
      ? `${t.partner.firstName} ${t.partner.lastName}`
      : "—",
    status: t.status,
    pickup: t.pickup,
    dropoff: t.dropoff,
    distanceKm: t.distanceKm,
    fare: t.fare,
    currency: t.currency ?? "KES",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  );
});

const tripDetails = asyncHandler(async (req, res) => {
  const t = await Trip.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .populate("partner", "firstName lastName phone")
    .lean();

  if (!t) throw new ApiError(404, "Trip not found");

  const trip = {
    _id: t._id,
    reference: t.reference,
    customerId: t.customer?._id ?? null,
    customerName: t.customer
      ? `${t.customer.firstName} ${t.customer.lastName}`
      : "—",
    partnerId: t.partner?._id ?? null,
    partnerName: t.partner
      ? `${t.partner.firstName} ${t.partner.lastName}`
      : "—",
    status: t.status,
    pickup: t.pickup,
    dropoff: t.dropoff,
    distanceKm: t.distanceKm,
    fare: t.fare,
    currency: t.currency ?? "KES",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { trip }));
});

const broadcasts = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = buildPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.reference = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    BroadcastRequest.find(filter)
      .populate("customer", "firstName lastName email phone")
      .populate("acceptedBy", "name town")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BroadcastRequest.countDocuments(filter),
  ]);

  const data = items.map((b) => ({
    _id: b._id,
    reference: b.reference,
    customerId: b.customer?._id ?? null,
    customerName: b.customer
      ? `${b.customer.firstName} ${b.customer.lastName}`
      : "—",
    foodType: b.foodType,
    budget: b.budget,
    currency: b.currency ?? "KES",
    radiusKm: b.broadcastRadiusKm,
    status: b.status,
    acceptedBy: b.acceptedBy?._id ?? null,
    acceptedByName: b.acceptedBy?.name ?? null,
    expiresAt: b.broadcastExpiresAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  );
});

const broadcastDetails = asyncHandler(async (req, res) => {
  const b = await BroadcastRequest.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .populate("acceptedBy", "name town email phone")
    .lean();

  if (!b) throw new ApiError(404, "Broadcast not found");

  const broadcast = {
    _id: b._id,
    reference: b.reference,
    customerId: b.customer?._id ?? null,
    customerName: b.customer
      ? `${b.customer.firstName} ${b.customer.lastName}`
      : "—",
    foodType: b.foodType,
    budget: b.budget,
    currency: b.currency ?? "KES",
    radiusKm: b.broadcastRadiusKm,
    status: b.status,
    acceptedBy: b.acceptedBy?._id ?? null,
    acceptedByName: b.acceptedBy?.name ?? null,
    expiresAt: b.broadcastExpiresAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };

  res.status(200).json(new ApiResponse(200, { broadcast }));
});

export {
  bookings,
  bookingDetails,
  orders,
  orderDetails,
  trips,
  tripDetails,
  broadcasts,
  broadcastDetails,
};