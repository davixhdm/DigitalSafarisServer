import mongoose from "mongoose";

const broadcastRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    foodType: { type: String, required: true, trim: true },
    preparation: { type: String, required: true },
    timeNeeded: { type: Date, required: true },
    budget: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    deliveryAddress: {
      address: { type: String, required: true },
      town: { type: String, required: true, trim: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      notes: { type: String, default: null },
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    broadcastRadiusKm: { type: Number, required: true, min: 1 },
    broadcastExpiresAt: { type: Date, required: true },
    targetedRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RestaurantPartner",
      },
    ],
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      default: null,
    },
    acceptedAt: { type: Date, default: null },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      default: null,
    },
    status: {
      type: String,
      enum: ["broadcasting", "accepted", "expired", "cancelled"],
      default: "broadcasting",
    },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

broadcastRequestSchema.index({ status: 1 });
broadcastRequestSchema.index({ customer: 1, createdAt: -1 });
broadcastRequestSchema.index({ broadcastExpiresAt: 1 });
broadcastRequestSchema.index({ location: 1, status: 1 });

const BroadcastRequest = mongoose.model("BroadcastRequest", broadcastRequestSchema);

export default BroadcastRequest;