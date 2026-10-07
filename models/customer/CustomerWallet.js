import mongoose from "mongoose";

const customerWalletSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    totalCredited: { type: Number, default: 0, min: 0 },
    totalDebited: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "KES" },
    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
  },
  { timestamps: true }
);

const CustomerWallet = mongoose.model("CustomerWallet", customerWalletSchema);

export default CustomerWallet;