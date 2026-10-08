import Download from "../../models/admin/Download.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { platform, available, search } = req.query;
  const filter = {};

  if (platform) filter.platform = platform;
  if (available === "true") filter.available = true;
  if (available === "false") filter.available = false;
  if (search) filter.name = new RegExp(search, "i");

  const items = await Download.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const item = await Download.findById(req.params.id).lean();
  if (!item) throw new ApiError(404, "Download not found");
  res.status(200).json(new ApiResponse(200, item));
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    platform,
    architecture,
    version,
    size,
    url,
    minimumOs,
    checksum,
    releaseNotes,
    available,
  } = req.body;

  if (!name || !platform || !architecture || !version || !size || !url) {
    throw new ApiError(400, "Missing required fields");
  }

  const item = await Download.create({
    name,
    platform,
    architecture,
    version,
    size,
    url,
    minimumOs: minimumOs || null,
    checksum: checksum || null,
    releaseNotes: releaseNotes || null,
    available: available ?? true,
    createdBy: req.admin._id,
    updatedBy: req.admin._id,
  });

  res.status(201).json(new ApiResponse(201, item, "Download created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "platform",
    "architecture",
    "version",
    "size",
    "url",
    "minimumOs",
    "checksum",
    "releaseNotes",
    "available",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  updates.updatedBy = req.admin._id;

  const item = await Download.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );

  if (!item) throw new ApiError(404, "Download not found");

  res.status(200).json(new ApiResponse(200, item, "Download updated"));
});

const remove = asyncHandler(async (req, res) => {
  const item = await Download.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Download not found");
  res.status(200).json(new ApiResponse(200, null, "Download deleted"));
});

const toggleAvailable = asyncHandler(async (req, res) => {
  const item = await Download.findById(req.params.id);
  if (!item) throw new ApiError(404, "Download not found");

  item.available = !item.available;
  item.updatedBy = req.admin._id;
  await item.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { available: item.available },
        item.available ? "Download enabled" : "Download disabled"
      )
    );
});

export { list, details, create, update, remove, toggleAvailable };