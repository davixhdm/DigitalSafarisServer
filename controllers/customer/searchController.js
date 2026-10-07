import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Property from "../../models/accom/Property.js";
import MenuItem from "../../models/rest/MenuItem.js";
import Room from "../../models/accom/Room.js";
import Location from "../../models/admin/Location.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const restaurants = asyncHandler(async (req, res) => {
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

const accommodations = asyncHandler(async (req, res) => {
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

const properties = asyncHandler(async (req, res) => {
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

const rooms = asyncHandler(async (req, res) => {
  const { propertyId, type, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };

  if (propertyId) filter.property = propertyId;
  if (type) filter.type = type;
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Room.find(filter).sort({ basePrice: 1 }).skip(skip).limit(Number(limit)).lean(),
    Room.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const menuItems = asyncHandler(async (req, res) => {
  const { q, restaurantId, menuId, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };

  if (restaurantId) filter.restaurant = restaurantId;
  if (menuId) filter.menu = menuId;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).skip(skip).limit(Number(limit)).lean(),
    MenuItem.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const locations = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  const filter = { isOperational: true };
  if (type) filter.type = type;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { county: new RegExp(q, "i") }];

  const items = await Location.find(filter).sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const global = asyncHandler(async (req, res) => {
  const { q, town } = req.query;
  if (!q) {
    return res.status(200).json(new ApiResponse(200, { restaurants: [], accommodations: [], properties: [] }));
  }

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

export { restaurants, accommodations, properties, rooms, menuItems, locations, global };