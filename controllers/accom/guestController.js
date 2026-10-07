import Guest from "../../models/accom/Guest.js";
import Booking from "../../models/accom/Booking.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { booking, page = 1, limit = 20 } = req.query;

  const filter = { partner: req.partner._id };
  if (booking) filter.booking = booking;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Guest.find(filter)
      .populate("booking", "reference checkIn checkOut status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Guest.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const guest = await Guest.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("booking")
    .lean();

  if (!guest) throw new ApiError(404, "Guest not found");

  res.status(200).json(new ApiResponse(200, guest));
});

const create = asyncHandler(async (req, res) => {
  const { booking: bookingId, ...rest } = req.body;

  const booking = await Booking.findOne({
    _id: bookingId,
    partner: req.partner._id,
  });
  if (!booking) throw new ApiError(404, "Booking not found");

  const guest = await Guest.create({
    partner: req.partner._id,
    booking: booking._id,
    customer: booking.customer,
    ...rest,
  });

  res.status(201).json(new ApiResponse(201, guest, "Guest added"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "countryCode",
    "nationality",
    "idType",
    "idNumber",
    "isPrimary",
    "age",
    "notes",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const guest = await Guest.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!guest) throw new ApiError(404, "Guest not found");

  res.status(200).json(new ApiResponse(200, guest, "Guest updated"));
});

const remove = asyncHandler(async (req, res) => {
  const guest = await Guest.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!guest) throw new ApiError(404, "Guest not found");

  res.status(200).json(new ApiResponse(200, null, "Guest deleted"));
});

export { list, details, create, update, remove };