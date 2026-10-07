import Menu from "../../models/rest/Menu.js";
import MenuItem from "../../models/rest/MenuItem.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const items = await Menu.find({ restaurant: req.partner._id })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, items));
});

const create = asyncHandler(async (req, res) => {
  const { name, description, image, category, displayOrder } = req.body;

  const menu = await Menu.create({
    restaurant: req.partner._id,
    name,
    description: description || "",
    image: image || null,
    category: category || null,
    displayOrder: displayOrder ?? 0,
  });

  res.status(201).json(new ApiResponse(201, menu, "Menu created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = ["name", "description", "image", "category", "status", "displayOrder"];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const menu = await Menu.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!menu) throw new ApiError(404, "Menu not found");

  res.status(200).json(new ApiResponse(200, menu, "Menu updated"));
});

const remove = asyncHandler(async (req, res) => {
  const menu = await Menu.findOneAndDelete({
    _id: req.params.id,
    restaurant: req.partner._id,
  });
  if (!menu) throw new ApiError(404, "Menu not found");

  await MenuItem.deleteMany({ menu: menu._id });

  res.status(200).json(new ApiResponse(200, null, "Menu deleted"));
});

export { list, create, update, remove };