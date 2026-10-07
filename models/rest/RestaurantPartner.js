import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const restaurantPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    countryCode: { type: String, default: "+254", trim: true },
    password: { type: String, required: true, select: false },
    logo: { type: String, default: null },
    coverImage: { type: String, default: null },
    description: { type: String, default: "" },
    cuisineTypes: [{ type: String, trim: true }],
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    town: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    businessHours: [
      {
        day: {
          type: String,
          enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        },
        open: { type: String, default: "08:00" },
        close: { type: String, default: "22:00" },
        isClosed: { type: Boolean, default: false },
      },
    ],
    supportsDelivery: { type: Boolean, default: true },
    supportsDineIn: { type: Boolean, default: true },
    supportsPickup: { type: Boolean, default: true },
    deliveryRadiusKm: { type: Number, default: 5, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    serviceTypes: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected", "closed"],
      default: "pending",
    },
    isOpen: { type: Boolean, default: false },
    isAcceptingOrders: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    documents: {
      businessPermit: { type: String, default: null },
      healthCertificate: { type: String, default: null },
      taxCertificate: { type: String, default: null },
      idFront: { type: String, default: null },
      idBack: { type: String, default: null },
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, select: false, default: null },
    fcmToken: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

restaurantPartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

restaurantPartnerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

restaurantPartnerSchema.index({ isDeleted: 1, status: 1 });
restaurantPartnerSchema.index({ location: 1, town: 1 });
restaurantPartnerSchema.index({ isOpen: 1, isAcceptingOrders: 1 });
restaurantPartnerSchema.index({ latitude: 1, longitude: 1 });
restaurantPartnerSchema.index({ name: "text", description: "text" });

const RestaurantPartner = mongoose.model("RestaurantPartner", restaurantPartnerSchema);

export default RestaurantPartner;