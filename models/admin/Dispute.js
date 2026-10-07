import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    raisedBy: {
      type: String,
      enum: ["customer", "restaurant", "transport", "accommodation"],
      required: true,
    },
    raisedById: { type: mongoose.Schema.Types.ObjectId, required: true },
    against: {
      type: String,
      enum: ["customer", "restaurant", "transport", "accommodation", "platform"],
      required: true,
    },
    againstId: { type: mongoose.Schema.Types.ObjectId, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, default: null },
    trip: { type: mongoose.Schema.Types.ObjectId, default: null },
    category: {
      type: String,
      enum: ["payment", "delivery", "quality", "service", "refund", "other"],
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    attachments: [{ type: String }],
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "rejected", "closed"],
      default: "open",
    },
    resolution: { type: String, default: null },
    refundAmount: { type: Number, default: 0 },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
    messages: [
      {
        sender: {
          type: String,
          enum: ["customer", "restaurant", "transport", "accommodation", "admin"],
        },
        senderId: { type: mongoose.Schema.Types.ObjectId },
        message: { type: String },
        attachments: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ raisedById: 1 });
disputeSchema.index({ againstId: 1 });

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;