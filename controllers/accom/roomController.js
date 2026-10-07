import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const filter = { partner: req.partner._id };
  if (req.query.property) filter.property = req.query.property;
  if (req.query.status) filter.status = req.query.status;

  const items = await Room.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const room = await Room.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();

  if (!room) throw new ApiError(404, "Room not found");

  res.status(200).json(new ApiResponse(200, room));
});

const create = asyncHandler(async (req, res) => {
  const {
    property,
    name,
    description,
    type,
    capacity,
    beds,
    sizeSqm,
    images,
    amenities,
    basePrice,
    weekendPrice,
    seasonalPrices,
    totalUnits,
    isFeatured,
  } = req.body;

  const propertyDoc = await Property.findOne({
    _id: property,
    partner: req.partner._id,
  });
  if (!propertyDoc) throw new ApiError(404, "Property not found");

  const room = await Room.create({
    partner: req.partner._id,
    property: propertyDoc._id,
    name,
    description: description || "",
    type,
    capacity,
    beds,
    sizeSqm: sizeSqm ?? null,
    images: images || [],
    amenities: amenities || [],
    basePrice,
    weekendPrice: weekendPrice ?? null,
    seasonalPrices: seasonalPrices || [],
    totalUnits,
    status: "active",
    isFeatured: isFeatured ?? false,
  });

  res.status(201).json(new ApiResponse(201, room, "Room created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "type",
    "capacity",
    "beds",
    "sizeSqm",
    "images",
    "amenities",
    "basePrice",
    "weekendPrice",
    "seasonalPrices",
    "totalUnits",
    "status",
    "isFeatured",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const room = await Room.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!room) throw new ApiError(404, "Room not found");

  res.status(200).json(new ApiResponse(200, room, "Room updated"));
});

const remove = asyncHandler(async (req, res) => {
  const room = await Room.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!room) throw new ApiError(404, "Room not found");

  await RoomAvailability.deleteMany({ room: room._id });

  res.status(200).json(new ApiResponse(200, null, "Room deleted"));
});

export { list, details, create, update, remove };