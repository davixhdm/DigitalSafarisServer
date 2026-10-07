import mongoose from "mongoose";

const customerPreferenceSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    categories: {
      orderUpdates: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
      tripUpdates: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      newsletters: { type: Boolean, default: false },
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: { type: String, default: "en" },
    currency: { type: String, default: "KES" },
    favorites: {
      restaurants: [{ type: mongoose.Schema.Types.ObjectId }],
      accommodations: [{ type: mongoose.Schema.Types.ObjectId }],
      transports: [{ type: mongoose.Schema.Types.ObjectId }],
    },
  },
  { timestamps: true }
);

const CustomerPreference = mongoose.model("CustomerPreference", customerPreferenceSchema);

export default CustomerPreference;