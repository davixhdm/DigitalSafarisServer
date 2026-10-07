import Menu from "../../models/rest/Menu.js";
import MenuItem from "../../models/rest/MenuItem.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const filter = { restaurant: req.partner._id };
  if (req.query.menu) filter.menu = req.query.menu;
  if (req.query.status) filter.status = req.query.status;

  const items = await MenuItem.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, items));
});

const create = asyncHandler(async (req, res) => {
  const {
    menu,
    name,
    description,
    image,
    price,
    discountPrice,
    preparationTimeMinutes,
    ingredients,
    allergens,
    dietary,
    isAvailable,
    isFeatured,
    displayOrder,
  } = req.body;

  const menuDoc = await Menu.findOne({ _id: menu, restaurant: req.partner._id });
  if (!menuDoc) throw new ApiError(404, "Menu not found");

  const item = await MenuItem.create({
    restaurant: req.partner._id,
    menu: menuDoc._id,
    name,
    description: description || "",
    image: image || null,
    price,
    discountPrice: discountPrice ?? null,
    preparationTimeMinutes: preparationTimeMinutes ?? 15,
    ingredients: ingredients || [],
    allergens: allergens || [],
    dietary: dietary || [],
    isAvailable: isAvailable ?? true,
    isFeatured: isFeatured ?? false,
    displayOrder: displayOrder ?? 0,
  });

  res.status(201).json(new ApiResponse(201, item, "Menu item created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "menu",
    "name",
    "description",
    "image",
    "price",
    "discountPrice",
    "preparationTimeMinutes",
    "ingredients",
    "allergens",
    "dietary",
    "isAvailable",
    "isFeatured",
    "status",
    "displayOrder",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  if (updates.menu) {
    const menuDoc = await Menu.findOne({
      _id: updates.menu,
      restaurant: req.partner._id,
    });
    if (!menuDoc) throw new ApiError(404, "Menu not found");
  }

  const item = await MenuItem.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!item) throw new ApiError(404, "Menu item not found");

  res.status(200).json(new ApiResponse(200, item, "Menu item updated"));
});

const remove = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOneAndDelete({
    _id: req.params.id,
    restaurant: req.partner._id,
  });

  if (!item) throw new ApiError(404, "Menu item not found");

  res.status(200).json(new ApiResponse(200, null, "Menu item deleted"));
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOne({
    _id: req.params.id,
    restaurant: req.partner._id,
  });
  if (!item) throw new ApiError(404, "Menu item not found");

  item.isAvailable = !item.isAvailable;
  await item.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAvailable: item.isAvailable },
        item.isAvailable ? "Marked available" : "Marked unavailable"
      )
    );
});

export { list, create, update, remove, toggleAvailability };