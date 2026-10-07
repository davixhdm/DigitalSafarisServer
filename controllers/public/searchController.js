import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Property from "../../models/accom/Property.js";
import MenuItem from "../../models/rest/MenuItem.js";
import Location from "../../models/admin/Location.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const searchRestaurants = asyncHandler(async (req, res) => {
  const { q, town, cuisine, page = 1, limit = 20 } = req.query;
  const filter = { status: "active", isDeleted: false };

  if (town) filter.town = new RegExp(town, "i");
  if (cuisine) filter.cuisineTypes = cuisine;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    RestaurantPartner.find(filter).sort({ rating: -1 }).skip(skip).limit(Number(limit)).lean(),
    RestaurantPartner.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const searchAccommodations = asyncHandler(async (req, res) => {
  const { q, town, type, page = 1, limit = 20 } = req.query;
  const filter = { status: "active", isDeleted: false };

  if (town) filter.town = new RegExp(town, "i");
  if (type) filter.type = type;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AccommodationPartner.find(filter).sort({ rating: -1 }).skip(skip).limit(Number(limit)).lean(),
    AccommodationPartner.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const searchProperties = asyncHandler(async (req, res) => {
  const { q, town, type, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };

  if (town) filter.town = new RegExp(town, "i");
  if (type) filter.type = type;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Property.find(filter).sort({ rating: -1 }).skip(skip).limit(Number(limit)).lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const searchMenuItems = asyncHandler(async (req, res) => {
  const { q, restaurantId, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };

  if (restaurantId) filter.restaurant = restaurantId;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).skip(skip).limit(Number(limit)).lean(),
    MenuItem.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const searchLocations = asyncHandler(async (req, res) => {
  const { q, type, isOperational } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (isOperational === "true") filter.isOperational = true;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { county: new RegExp(q, "i") }];

  const items = await Location.find(filter).sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const globalSearch = asyncHandler(async (req, res) => {
  const { q, town } = req.query;
  if (!q) return res.status(200).json(new ApiResponse(200, { restaurants: [], accommodations: [], properties: [] }));

  const textFilter = new RegExp(q, "i");
  const townFilter = town ? new RegExp(town, "i") : null;

  const [restaurants, accommodations, properties] = await Promise.all([
    RestaurantPartner.find({
      status: "active",
      isDeleted: false,
      ...(townFilter && { town: townFilter }),
      $or: [{ name: textFilter }, { description: textFilter }],
    }).limit(10).lean(),
    AccommodationPartner.find({
      status: "active",
      isDeleted: false,
      ...(townFilter && { town: townFilter }),
      $or: [{ name: textFilter }, { description: textFilter }],
    }).limit(10).lean(),
    Property.find({
      status: "active",
      ...(townFilter && { town: townFilter }),
      $or: [{ name: textFilter }, { description: textFilter }],
    }).limit(10).lean(),
  ]);

  res.status(200).json(new ApiResponse(200, { restaurants, accommodations, properties }));
});

export { searchRestaurants, searchAccommodations, searchProperties, searchMenuItems, searchLocations, globalSearch };