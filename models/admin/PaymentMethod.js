import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["mpesa", "stripe", "wallet"],
      required: true,
      unique: true,
    },
    label: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: false },
    usedFor: {
      type: [String],
      enum: ["accommodation", "restaurant", "transport", "dinein"],
      default: [],
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;