import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    bio: { type: String, default: "" },
    language: { type: String, default: "en" },
    currency: { type: String, default: "KES" },
    timezone: { type: String, default: "Africa/Nairobi" },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    town: { type: String, default: null, trim: true },
    travelInterests: [{ type: String, trim: true }],
    dietaryPreferences: [{ type: String, trim: true }],
    accessibilityNeeds: [{ type: String, trim: true }],
    emergencyContact: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      relationship: { type: String, default: null },
    },
    marketingOptIn: { type: Boolean, default: false },
    pushOptIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerProfileSchema.index({ location: 1 });
customerProfileSchema.index({ town: 1 });

const CustomerProfile = mongoose.model("CustomerProfile", customerProfileSchema);

export default CustomerProfile;