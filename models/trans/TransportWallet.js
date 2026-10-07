import mongoose from "mongoose";

const transportWalletSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalCommissionOwed: { type: Number, default: 0, min: 0 },
    totalCommissionPaid: { type: Number, default: 0, min: 0 },
    totalPaidOut: { type: Number, default: 0, min: 0 },
    pendingPayout: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "KES" },
    payoutMethod: {
      type: String,
      enum: ["mpesa", "bank"],
      default: "mpesa",
    },
    payoutDetails: {
      phone: { type: String, default: null },
      bankName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      accountName: { type: String, default: null },
    },
    payoutFrequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly"],
      default: "weekly",
    },
    minimumPayout: { type: Number, default: 500 },
    lastPayoutAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
  },
  { timestamps: true }
);

const TransportWallet = mongoose.model("TransportWallet", transportWalletSchema);

export default TransportWallet;