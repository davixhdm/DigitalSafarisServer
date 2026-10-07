import mongoose from "mongoose";

const deliveryJobSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
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
    distanceKm: { type: Number, default: 0 },
    fee: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    partnerEarnings: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    status: {
      type: String,
      enum: ["broadcasting", "accepted", "picked_up", "delivered", "expired", "cancelled"],
      default: "broadcasting",
    },
    broadcastExpiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "restaurant", "partner", "admin", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true }
);

deliveryJobSchema.index({ status: 1 });
deliveryJobSchema.index({ partner: 1, status: 1 });
deliveryJobSchema.index({ broadcastExpiresAt: 1 });
deliveryJobSchema.index({ restaurant: 1 });

const DeliveryJob = mongoose.model("DeliveryJob", deliveryJobSchema);

export default DeliveryJob;