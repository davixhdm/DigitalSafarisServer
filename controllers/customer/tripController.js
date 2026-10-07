import Trip from "../../models/trans/Trip.js";
import Vehicle from "../../models/trans/Vehicle.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";
import calculateDistance from "../../utils/calculateDistance.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return { branding, settings: general?.value || {}, commission: commission?.value || { transport: 10 } };
};

const estimateFare = (distanceKm, serviceType) => {
  const base = serviceType === "bike" ? 50 : serviceType === "car" ? 150 : 200;
  const perKm = serviceType === "bike" ? 30 : 60;
  return Math.round(base + perKm * distanceKm);
};

const quote = asyncHandler(async (req, res) => {
  const { pickup, dropoff, serviceType } = req.body;
  const distanceKm = calculateDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
  const fare = estimateFare(distanceKm, serviceType || "car");

  res.status(200).json(
    new ApiResponse(200, { distanceKm: Number(distanceKm.toFixed(2)), fare, currency: "KES" })
  );
});

const create = asyncHandler(async (req, res) => {
  const { pickup, dropoff, scheduledAt, passengers, luggage, serviceType, paymentMethod, notes } = req.body;

  const distanceKm = calculateDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);

  const available = await DriverLocation.find({
    isOnline: true,
    isAvailable: true,
    town: new RegExp(pickup.town, "i"),
  }).populate("partner");

  const nearby = available.filter((d) => {
    const dist = calculateDistance(pickup.latitude, pickup.longitude, d.latitude, d.longitude);
    return dist <= 10;
  });

  if (nearby.length === 0) throw new ApiError(400, "No drivers available in your area");

  const serviceFilter = serviceType || "car";
  const matched = nearby.filter((d) => d.partner?.serviceTypes?.includes(serviceFilter));
  if (matched.length === 0) throw new ApiError(400, `No ${serviceFilter} drivers available`);

  const fare = estimateFare(distanceKm, serviceFilter);
  const { commission } = await getContext();
  const commissionRate = commission.transport || 10;
  const commissionAmount = (fare * commissionRate) / 100;

  const driver = matched[0];
  const vehicle = await Vehicle.findOne({ partner: driver.partner._id, status: "active" });

  if (!vehicle) throw new ApiError(400, "Driver has no active vehicle");

  const trip = await Trip.create({
    reference: generateRef("TRP"),
    customer: req.customer._id,
    partner: driver.partner._id,
    vehicle: vehicle._id,
    type: "local",
    pickup,
    dropoff,
    scheduledAt,
    passengers: passengers || 1,
    luggage: luggage || 0,
    distanceKm: Number(distanceKm.toFixed(2)),
    fare,
    commissionRate,
    commissionAmount,
    partnerEarnings: fare - commissionAmount,
    paymentMethod,
    status: "accepted",
    notes: notes || null,
    startedAt: null,
  });

  if (paymentMethod === "wallet") {
    const wallet = await CustomerWallet.findOne({ customer: req.customer._id });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    if (wallet.balance < fare) throw new ApiError(400, "Insufficient wallet balance");

    wallet.balance -= fare;
    wallet.totalDebited += fare;
    await wallet.save();

    await CustomerPayment.create({
      customer: req.customer._id,
      reference: generateRef("PAY"),
      method: "wallet",
      purpose: "transport",
      relatedId: trip._id,
      amount: fare,
      status: "success",
    });

    trip.paymentStatus = "paid";
    await trip.save();
  }

  driver.isAvailable = false;
  driver.activeTrip = trip._id;
  await driver.save();

  socketService.emitToTransport(driver.partner._id.toString(), "trip:new", {
    reference: trip.reference,
    pickup: trip.pickup.address,
    dropoff: trip.dropoff.address,
  });

  const { branding, settings } = await getContext();
  await emailService.tripBookingConfirmation(req.customer, { trip, branding, settings });
  await emailService.driverAssigned(req.customer, {
    trip,
    driver: driver.partner,
    vehicle,
    branding,
    settings,
  });
  await smsService.tripBookingConfirmation(req.customer, {
    reference: trip.reference,
    pickup: trip.pickup.address,
    scheduledAt: new Date(trip.scheduledAt).toLocaleString(),
  });

  res.status(201).json(new ApiResponse(201, trip, "Trip confirmed"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Trip.find(filter)
      .populate("partner", "firstName lastName phone avatar rating")
      .populate("vehicle", "make model plateNumber color")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Trip.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const details = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, customer: req.customer._id })
    .populate("partner", "firstName lastName phone avatar rating")
    .populate("vehicle", "make model plateNumber color photos");
  if (!trip) throw new ApiError(404, "Trip not found");
  res.status(200).json(new ApiResponse(200, trip));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const trip = await Trip.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (["completed", "cancelled", "ongoing"].includes(trip.status)) throw new ApiError(400, "Cannot cancel");

  trip.status = "cancelled";
  trip.cancelledBy = "customer";
  trip.cancellationReason = reason || "Customer requested";
  await trip.save();

  await DriverLocation.updateOne(
    { partner: trip.partner, activeTrip: trip._id },
    { $set: { isAvailable: true, activeTrip: null } }
  );

  socketService.emitToTransport(trip.partner.toString(), "trip:cancelled", {
    reference: trip.reference,
  });

  const { branding, settings } = await getContext();
  await emailService.tripCancelled(req.customer, { trip, reason, branding, settings });
  await smsService.tripCancelled(req.customer, { reference: trip.reference, reason });

  res.status(200).json(new ApiResponse(200, trip, "Trip cancelled"));
});

const rate = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  const trip = await Trip.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.status !== "completed") throw new ApiError(400, "Trip not completed");

  trip.rating = rating;
  trip.review = review || null;
  await trip.save();

  const partner = await TransportPartner.findById(trip.partner);
  if (partner) {
    const totalRatings = partner.totalRatings + 1;
    const newRating = (partner.rating * partner.totalRatings + rating) / totalRatings;
    partner.rating = Number(newRating.toFixed(2));
    partner.totalRatings = totalRatings;
    await partner.save();
  }

  res.status(200).json(new ApiResponse(200, trip, "Rating submitted"));
});

export { quote, create, list, details, cancel, rate };