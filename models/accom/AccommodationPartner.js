import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const accommodationPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, default: "", trim: true },
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
    avatar: { type: String, default: null },
    logo: { type: String, default: null },
    coverImage: { type: String, default: null },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["hotel", "lodge", "camp", "resort", "bnb", "guesthouse", "villa", "apartment"],
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    town: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    amenities: [{ type: String, trim: true }],
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected", "closed"],
      default: "pending",
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    documents: {
      businessPermit: { type: String, default: null },
      taxCertificate: { type: String, default: null },
      tourismLicense: { type: String, default: null },
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

accommodationPartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

accommodationPartnerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

accommodationPartnerSchema.index({ isDeleted: 1, status: 1 });
accommodationPartnerSchema.index({ location: 1, town: 1 });
accommodationPartnerSchema.index({ latitude: 1, longitude: 1 });
accommodationPartnerSchema.index({ name: "text", description: "text" });

accommodationPartnerSchema.virtual("category").get(() => "accommodation");
accommodationPartnerSchema.set("toJSON", { virtuals: true });
accommodationPartnerSchema.set("toObject", { virtuals: true });

const AccommodationPartner = mongoose.model("AccommodationPartner", accommodationPartnerSchema);

export default AccommodationPartner;