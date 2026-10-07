import Location from "../../models/admin/Location.js";
import asyncHandler from "../../utils/asyncHandler.js";

const listTowns = asyncHandler(async (req, res) => {
  const towns = await Location.find({
    isOperational: true,
    type: { $in: ["town", "city"] },
  })
    .select("name slug type county countryCode")
    .sort({ name: 1 })
    .lean();

  res.status(200).json({ towns });
});

export { listTowns };