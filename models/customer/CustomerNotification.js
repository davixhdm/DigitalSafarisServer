import mongoose from "mongoose";

const customerNotificationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["order", "booking", "trip", "payment", "payout", "promo", "system"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["in_app", "push", "email", "sms"],
      default: "in_app",
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

customerNotificationSchema.index({ customer: 1, isRead: 1, createdAt: -1 });

const CustomerNotification = mongoose.model("CustomerNotification", customerNotificationSchema);

export default CustomerNotification;