import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    type: {
      type: String,
      enum: ["airport_transfer", "intercity", "game_drive", "local", "delivery", "other"],
      required: true,
    },
    pickup: {
      address: { type: String, required: true },
      town: { type: String, required: true, trim: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    dropoff: {
      address: { type: String, required: true },
      town: { type: String, required: true, trim: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    scheduledAt: { type: Date, required: true },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    distanceKm: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    passengers: { type: Number, default: 1 },
    luggage: { type: Number, default: 0 },
    fare: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    partnerEarnings: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    paymentMethod: {
      type: String,
      enum: ["mpesa", "stripe", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "ongoing", "completed", "cancelled", "failed"],
      default: "requested",
    },
    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "partner", "admin", null],
      default: null,
    },
    notes: { type: String, default: null },
    rating: { type: Number, default: null, min: 1, max: 5 },
    review: { type: String, default: null },
  },
  { timestamps: true }
);

tripSchema.index({ customer: 1, createdAt: -1 });
tripSchema.index({ partner: 1, createdAt: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledAt: 1 });

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;