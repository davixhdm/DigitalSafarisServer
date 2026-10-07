import mongoose from "mongoose";

const customerOTPSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    identifier: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["verify_email", "verify_phone", "reset_password", "login"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

customerOTPSchema.index({ identifier: 1, purpose: 1 });
customerOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerOTP = mongoose.model("CustomerOTP", customerOTPSchema);

export default CustomerOTP;