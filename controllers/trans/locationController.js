import DriverLocation from "../../models/trans/DriverLocation.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as socketService from "../../services/socketService.js";

const get = asyncHandler(async (req, res) => {
  const location = await DriverLocation.findOne({ partner: req.partner._id }).lean();

  res.status(200).json(
    new ApiResponse(
      200,
      location || {
        partner: req.partner._id,
        latitude: null,
        longitude: null,
        isOnline: false,
        isAvailable: false,
        lastPingAt: null,
      }
    )
  );
});

const ping = asyncHandler(async (req, res) => {
  const { latitude, longitude, heading, speed, accuracy } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new ApiError(400, "latitude and longitude are required");
  }

  const location = await DriverLocation.findOneAndUpdate(
    { partner: req.partner._id },
    {
      $set: {
        partner: req.partner._id,
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        accuracy: accuracy ?? null,
        isOnline: true,
        town: req.partner.town || null,
        lastPingAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  if (location.activeTrip) {
    socketService.emitToRoom(
      `trip:${location.activeTrip}`,
      "driver:location",
      { latitude, longitude, heading, speed }
    );
  }

  if (location.activeDelivery) {
    socketService.emitToRoom(
      `delivery:${location.activeDelivery}`,
      "driver:location",
      { latitude, longitude, heading, speed }
    );
  }

  res.status(200).json(new ApiResponse(200, location, "Location updated"));
});

const setAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;

  const location = await DriverLocation.findOneAndUpdate(
    { partner: req.partner._id },
    { $set: { isAvailable: Boolean(isAvailable), lastPingAt: new Date() } },
    { upsert: true, new: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAvailable: location.isAvailable },
        location.isAvailable ? "Available" : "Unavailable"
      )
    );
});

export { get, ping, setAvailability };