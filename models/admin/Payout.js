import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, required: true },
    partnerType: {
      type: String,
      enum: ["restaurant", "transport", "accommodation"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["mpesa", "bank", "wallet"],
      required: true,
    },
    type: {
      type: String,
      enum: ["auto", "manual"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "rejected"],
      default: "pending",
    },
    reference: { type: String, unique: true, required: true },
    transactionId: { type: String, default: null },
    failureReason: { type: String, default: null },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    processedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

payoutSchema.index({ partner: 1, partnerType: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;