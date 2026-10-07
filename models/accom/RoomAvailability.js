import mongoose from "mongoose";

const roomAvailabilitySchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: { type: Date, required: true },
    totalUnits: { type: Number, required: true, min: 0 },
    bookedUnits: { type: Number, default: 0, min: 0 },
    blockedUnits: { type: Number, default: 0, min: 0 },
    availableUnits: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: null },
  },
  { timestamps: true }
);

roomAvailabilitySchema.index({ room: 1, date: 1 }, { unique: true });
roomAvailabilitySchema.index({ partner: 1, date: 1 });
roomAvailabilitySchema.index({ availableUnits: 1 });

const RoomAvailability = mongoose.model("RoomAvailability", roomAvailabilitySchema);

export default RoomAvailability;