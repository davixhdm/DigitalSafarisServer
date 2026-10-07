import Location from "../../models/admin/Location.js";
import { slugify } from "../../utils/helpers.js";
import * as cacheService from "../../services/cacheService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const flushAiContext = async () => {
  try {
    await cacheService.deleteCachePattern("ai:context:*");
  } catch {
    /* silent */
  }
};

const list = asyncHandler(async (req, res) => {
  const { type, search, isOperational, parent } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (parent) filter.parent = parent;
  if (isOperational === "true") filter.isOperational = true;
  if (isOperational === "false") filter.isOperational = false;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { county: new RegExp(search, "i") },
    ];
  }

  const items = await Location.find(filter).sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id).lean();
  if (!location) throw new ApiError(404, "Location not found");

  const children = await Location.find({ parent: location._id })
    .sort({ name: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, { location, children }));
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    parent,
    countryCode,
    county,
    latitude,
    longitude,
    radiusKm,
    timezone,
    currency,
    isOperational,
    isDefault,
  } = req.body;

  if (!name || !type || !countryCode) {
    throw new ApiError(400, "name, type, and countryCode are required");
  }

  const slug = slugify(name);
  const existing = await Location.findOne({ slug, type });
  if (existing) throw new ApiError(400, "Location already exists");

  const location = await Location.create({
    name,
    slug,
    type,
    parent: parent || null,
    countryCode,
    county: county || null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    radiusKm: radiusKm ?? 10,
    timezone: timezone || "Africa/Nairobi",
    currency: currency || "KES",
    isOperational: isOperational ?? true,
    isDefault: isDefault ?? false,
    createdBy: req.admin._id,
    updatedBy: req.admin._id,
  });

  await flushAiContext();

  res.status(201).json(new ApiResponse(201, location, "Location created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "type",
    "parent",
    "countryCode",
    "county",
    "latitude",
    "longitude",
    "radiusKm",
    "timezone",
    "currency",
    "isOperational",
    "isDefault",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  if (updates.name) updates.slug = slugify(updates.name);
  updates.updatedBy = req.admin._id;

  const location = await Location.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );

  if (!location) throw new ApiError(404, "Location not found");

  await flushAiContext();

  res.status(200).json(new ApiResponse(200, location, "Location updated"));
});

const remove = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw new ApiError(404, "Location not found");

  const children = await Location.countDocuments({ parent: location._id });
  if (children > 0) {
    throw new ApiError(
      400,
      "Cannot delete a location that has child locations"
    );
  }

  await Location.deleteOne({ _id: location._id });

  await flushAiContext();

  res.status(200).json(new ApiResponse(200, null, "Location deleted"));
});

const toggleOperational = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw new ApiError(404, "Location not found");

  location.isOperational = !location.isOperational;
  location.updatedBy = req.admin._id;
  await location.save();

  await flushAiContext();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOperational: location.isOperational },
        location.isOperational
          ? "Marked operational"
          : "Marked not operational"
      )
    );
});

export { list, details, create, update, remove, toggleOperational };