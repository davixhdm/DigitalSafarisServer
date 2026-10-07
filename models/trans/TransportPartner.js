import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const transportPartnerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
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
    avatar: { type: String, default: null },
    idNumber: { type: String, required: true, unique: true, trim: true },
    licenseNumber: { type: String, default: null, trim: true },
    licenseExpiry: { type: Date, default: null },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    town: { type: String, required: true, trim: true },
    address: { type: String, default: null, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    serviceTypes: [
      {
        type: String,
        enum: ["bike", "car", "van", "truck", "bus", "boat"],
      },
    ],
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected", "offline"],
      default: "pending",
    },
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    documents: {
      idFront: { type: String, default: null },
      idBack: { type: String, default: null },
      license: { type: String, default: null },
      insurance: { type: String, default: null },
      goodConduct: { type: String, default: null },
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

transportPartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

transportPartnerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

transportPartnerSchema.index({ isDeleted: 1, status: 1 });
transportPartnerSchema.index({ location: 1, town: 1 });
transportPartnerSchema.index({ isOnline: 1, isAvailable: 1 });
transportPartnerSchema.index({ latitude: 1, longitude: 1 });

const TransportPartner = mongoose.model("TransportPartner", transportPartnerSchema);

export default TransportPartner;