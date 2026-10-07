import Trip from "../../models/trans/Trip.js";
import DeliveryJob from "../../models/trans/DeliveryJob.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Booking from "../../models/accom/Booking.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const trackTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ reference: req.params.reference, customer: req.customer._id })
    .populate("partner", "firstName lastName phone avatar")
    .populate("vehicle", "make model plateNumber color");

  if (!trip) throw new ApiError(404, "Trip not found");

  const location = await DriverLocation.findOne({ partner: trip.partner._id }).lean();

  res.status(200).json(
    new ApiResponse(200, {
      trip: {
        reference: trip.reference,
        status: trip.status,
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        startedAt: trip.startedAt,
        driver: trip.partner,
        vehicle: trip.vehicle,
      },
      location: location
        ? { latitude: location.latitude, longitude: location.longitude, lastPingAt: location.lastPingAt }
        : null,
    })
  );
});

const trackDelivery = asyncHandler(async (req, res) => {
  const order = await FoodOrder.findOne({ reference: req.params.reference, customer: req.customer._id })
    .populate("restaurant", "name logo town address latitude longitude");

  if (!order) throw new ApiError(404, "Order not found");

  let delivery = null;
  let location = null;

  if (order.deliveryJob) {
    delivery = await DeliveryJob.findById(order.deliveryJob)
      .populate("partner", "firstName lastName phone avatar")
      .populate("vehicle", "make model plateNumber color");

    if (delivery?.partner) {
      location = await DriverLocation.findOne({ partner: delivery.partner._id }).lean();
    }
  }

  res.status(200).json(
    new ApiResponse(200, {
      order: {
        reference: order.reference,
        status: order.status,
        restaurant: order.restaurant,
        deliveryAddress: order.deliveryAddress,
      },
      delivery: delivery
        ? {
            status: delivery.status,
            driver: delivery.partner,
            vehicle: delivery.vehicle,
          }
        : null,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude, lastPingAt: location.lastPingAt }
        : null,
    })
  );
});

const trackBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ reference: req.params.reference, customer: req.customer._id })
    .populate("property", "name images address town latitude longitude")
    .populate("room", "name type images");

  if (!booking) throw new ApiError(404, "Booking not found");

  res.status(200).json(
    new ApiResponse(200, {
      reference: booking.reference,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      property: booking.property,
      room: booking.room,
      qrCode: booking.qrCode,
    })
  );
});

export { trackTrip, trackDelivery, trackBooking };