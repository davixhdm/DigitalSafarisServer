import mongoose from "mongoose";

const customerSessionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    refreshToken: { type: String, required: true },
    device: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

customerSessionSchema.index({ customer: 1 });
customerSessionSchema.index({ refreshToken: 1 }, { unique: true });
customerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerSession = mongoose.model("CustomerSession", customerSessionSchema);

export default CustomerSession;