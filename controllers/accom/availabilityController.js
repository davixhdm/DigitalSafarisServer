import Room from "../../models/accom/Room.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import Booking from "../../models/accom/Booking.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { room, from, to } = req.query;

  const filter = { partner: req.partner._id };
  if (room) filter.room = room;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const items = await RoomAvailability.find(filter).sort({ date: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const setRange = asyncHandler(async (req, res) => {
  const { room: roomId, from, to, totalUnits, price, isBlocked, blockReason } = req.body;

  const room = await Room.findOne({ _id: roomId, partner: req.partner._id });
  if (!room) throw new ApiError(404, "Room not found");

  const start = new Date(from);
  const end = new Date(to);
  if (end < start) throw new ApiError(400, "Invalid date range");

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const results = [];

  for (const date of days) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const bookedUnits = await Booking.aggregate([
      {
        $match: {
          room: room._id,
          status: { $in: ["confirmed", "checked_in"] },
          checkIn: { $lte: dayStart },
          checkOut: { $gt: dayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$roomsBooked" } } },
    ]);

    const booked = bookedUnits[0]?.total ?? 0;
    const units = totalUnits ?? room.totalUnits;
    const available = Math.max(0, units - booked);

    const doc = await RoomAvailability.findOneAndUpdate(
      { room: room._id, date: dayStart },
      {
        $set: {
          partner: req.partner._id,
          property: room.property,
          room: room._id,
          date: dayStart,
          totalUnits: units,
          bookedUnits: booked,
          availableUnits: available,
          price: price ?? room.basePrice,
          currency: room.currency || "KES",
          isBlocked: Boolean(isBlocked),
          blockReason: blockReason || null,
        },
      },
      { upsert: true, new: true }
    );

    results.push(doc);
  }

  res.status(200).json(new ApiResponse(200, results, "Availability updated"));
});

const blockDates = asyncHandler(async (req, res) => {
  const { room: roomId, from, to, reason } = req.body;

  const room = await Room.findOne({ _id: roomId, partner: req.partner._id });
  if (!room) throw new ApiError(404, "Room not found");

  const start = new Date(from);
  const end = new Date(to);

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  for (const date of days) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    await RoomAvailability.findOneAndUpdate(
      { room: room._id, date: dayStart },
      {
        $set: {
          partner: req.partner._id,
          property: room.property,
          room: room._id,
          date: dayStart,
          totalUnits: room.totalUnits,
          bookedUnits: 0,
          availableUnits: 0,
          price: room.basePrice,
          currency: room.currency || "KES",
          isBlocked: true,
          blockReason: reason || "Blocked by partner",
        },
      },
      { upsert: true, new: true }
    );
  }

  res.status(200).json(new ApiResponse(200, { count: days.length }, "Dates blocked"));
});

const unblockDates = asyncHandler(async (req, res) => {
  const { room: roomId, from, to } = req.body;

  const room = await Room.findOne({ _id: roomId, partner: req.partner._id });
  if (!room) throw new ApiError(404, "Room not found");

  const start = new Date(from);
  const end = new Date(to);

  const result = await RoomAvailability.updateMany(
    {
      room: room._id,
      date: { $gte: start, $lte: end },
    },
    { $set: { isBlocked: false, blockReason: null } }
  );

  res.status(200).json(
    new ApiResponse(200, { modified: result.modifiedCount }, "Dates unblocked")
  );
});

export { list, setRange, blockDates, unblockDates };