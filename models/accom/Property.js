import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
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
    images: [{ type: String }],
    amenities: [{ type: String, trim: true }],
    rules: [{ type: String, trim: true }],
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    totalRooms: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

propertySchema.index({ partner: 1, slug: 1 }, { unique: true });
propertySchema.index({ partner: 1, status: 1 });
propertySchema.index({ location: 1, town: 1 });
propertySchema.index({ latitude: 1, longitude: 1 });
propertySchema.index({ name: "text", description: "text" });

const Property = mongoose.model("Property", propertySchema);

export default Property;