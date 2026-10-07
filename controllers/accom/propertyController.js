import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import { slugify } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const items = await Property.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();

  if (!property) throw new ApiError(404, "Property not found");

  const rooms = await Room.find({ property: property._id }).lean();

  res.status(200).json(new ApiResponse(200, { property, rooms }));
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type,
    location,
    town,
    address,
    latitude,
    longitude,
    images,
    amenities,
    rules,
    checkInTime,
    checkOutTime,
    totalRooms,
  } = req.body;

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const property = await Property.create({
    partner: req.partner._id,
    name,
    slug,
    description: description || "",
    type,
    location,
    town,
    address,
    latitude,
    longitude,
    images: images || [],
    amenities: amenities || [],
    rules: rules || [],
    checkInTime: checkInTime || "14:00",
    checkOutTime: checkOutTime || "11:00",
    totalRooms: totalRooms ?? 0,
    status: "active",
  });

  res.status(201).json(new ApiResponse(201, property, "Property created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "type",
    "location",
    "town",
    "address",
    "latitude",
    "longitude",
    "images",
    "amenities",
    "rules",
    "checkInTime",
    "checkOutTime",
    "totalRooms",
    "status",
    "isFeatured",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const property = await Property.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!property) throw new ApiError(404, "Property not found");

  res.status(200).json(new ApiResponse(200, property, "Property updated"));
});

const remove = asyncHandler(async (req, res) => {
  const property = await Property.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!property) throw new ApiError(404, "Property not found");

  await Room.deleteMany({ property: property._id });

  res.status(200).json(new ApiResponse(200, null, "Property deleted"));
});

export { list, details, create, update, remove };