import mongoose from "mongoose";

const customerPaymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    reference: { type: String, required: true, unique: true },
    method: {
      type: String,
      enum: ["mpesa", "stripe", "wallet"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["booking", "food_order", "transport", "topup", "other"],
      required: true,
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    transactionId: { type: String, default: null },
    receiptNumber: { type: String, default: null },
    failureReason: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

customerPaymentSchema.index({ customer: 1, createdAt: -1 });
customerPaymentSchema.index({ status: 1 });

const CustomerPayment = mongoose.model("CustomerPayment", customerPaymentSchema);

export default CustomerPayment;