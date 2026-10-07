import Vehicle from "../../models/trans/Vehicle.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const items = await Vehicle.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  res.status(200).json(new ApiResponse(200, vehicle));
});

const create = asyncHandler(async (req, res) => {
  const {
    type,
    make,
    model,
    year,
    color,
    plateNumber,
    capacity,
    photos,
    insuranceNumber,
    insuranceExpiry,
    inspectionExpiry,
  } = req.body;

  const existing = await Vehicle.findOne({ plateNumber });
  if (existing) throw new ApiError(400, "Plate number already registered");

  const vehicle = await Vehicle.create({
    partner: req.partner._id,
    type,
    make,
    model,
    year,
    color,
    plateNumber,
    capacity,
    photos: photos || [],
    insuranceNumber: insuranceNumber || null,
    insuranceExpiry: insuranceExpiry || null,
    inspectionExpiry: inspectionExpiry || null,
    status: "pending",
    isDefault: false,
  });

  res.status(201).json(new ApiResponse(201, vehicle, "Vehicle submitted for approval"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "make",
    "model",
    "year",
    "color",
    "capacity",
    "photos",
    "insuranceNumber",
    "insuranceExpiry",
    "inspectionExpiry",
    "isDefault",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  res.status(200).json(new ApiResponse(200, vehicle, "Vehicle updated"));
});

const remove = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  res.status(200).json(new ApiResponse(200, null, "Vehicle deleted"));
});

const setDefault = asyncHandler(async (req, res) => {
  await Vehicle.updateMany(
    { partner: req.partner._id },
    { $set: { isDefault: false } }
  );

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: { isDefault: true } },
    { new: true }
  );

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  res.status(200).json(new ApiResponse(200, vehicle, "Default vehicle set"));
});

export { list, details, create, update, remove, setDefault };