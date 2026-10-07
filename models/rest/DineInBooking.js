import mongoose from "mongoose";

const dineInBookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    type: {
      type: String,
      enum: ["dine_in", "pickup"],
      required: true,
    },
    scheduledAt: { type: Date, required: true },
    partySize: { type: Number, required: true, min: 1 },
    preOrder: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
        notes: { type: String, default: null },
      },
    ],
    estimatedTotal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    restaurantEarnings: { type: Number, required: true, min: 0 },
    customerNotes: { type: String, default: null },
    restaurantNotes: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled", "no_show", "rejected"],
      default: "pending",
    },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "restaurant", "admin", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["mpesa", "stripe", "wallet", "cash", null],
      default: null,
    },
    paymentReference: { type: String, default: null },
  },
  { timestamps: true }
);

dineInBookingSchema.index({ customer: 1, createdAt: -1 });
dineInBookingSchema.index({ restaurant: 1, scheduledAt: 1 });
dineInBookingSchema.index({ status: 1 });

const DineInBooking = mongoose.model("DineInBooking", dineInBookingSchema);

export default DineInBooking;