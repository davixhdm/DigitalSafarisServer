import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["country", "county", "town", "city", "area"],
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    countryCode: { type: String, required: true, trim: true },
    county: { type: String, default: null, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    radiusKm: { type: Number, default: 10, min: 1 },
    timezone: { type: String, default: "Africa/Nairobi" },
    currency: { type: String, default: "KES" },
    isOperational: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

locationSchema.index({ type: 1, isOperational: 1 });
locationSchema.index({ parent: 1 });
locationSchema.index({ countryCode: 1, county: 1 });
locationSchema.index({ name: "text", county: "text" });

const Location = mongoose.model("Location", locationSchema);

export default Location;