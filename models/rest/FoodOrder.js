import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
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
      enum: ["delivery", "pickup"],
      required: true,
    },
    items: [
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
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    restaurantEarnings: { type: Number, required: true, min: 0 },
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
    paymentReference: { type: String, default: null },
    paymentReceipt: { type: String, default: null },
    deliveryAddress: {
      address: { type: String, default: null },
      town: { type: String, default: null, trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      notes: { type: String, default: null },
    },
    deliveryMethod: {
      type: String,
      enum: ["manual", "ds_transport", null],
      default: null,
    },
    deliveryJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryJob",
      default: null,
    },
    orderType: {
      type: String,
      enum: ["direct", "broadcast"],
      default: "direct",
    },
    broadcastRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BroadcastRequest",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },
    acceptedAt: { type: Date, default: null },
    preparedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "restaurant", "admin", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
    customerNotes: { type: String, default: null },
    restaurantNotes: { type: String, default: null },
  },
  { timestamps: true }
);

foodOrderSchema.index({ customer: 1, createdAt: -1 });
foodOrderSchema.index({ restaurant: 1, createdAt: -1 });
foodOrderSchema.index({ status: 1 });
foodOrderSchema.index({ paymentStatus: 1 });

const FoodOrder = mongoose.model("FoodOrder", foodOrderSchema);

export default FoodOrder;