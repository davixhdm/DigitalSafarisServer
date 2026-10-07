import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["single", "double", "twin", "suite", "deluxe", "family", "tent", "villa", "apartment"],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    beds: [
      {
        type: {
          type: String,
          enum: ["single", "double", "queen", "king", "bunk"],
          required: true,
        },
        count: { type: Number, required: true, min: 1 },
      },
    ],
    sizeSqm: { type: Number, default: null },
    images: [{ type: String }],
    amenities: [{ type: String, trim: true }],
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    weekendPrice: { type: Number, default: null, min: 0 },
    seasonalPrices: [
      {
        name: { type: String, required: true },
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalUnits: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roomSchema.index({ partner: 1, property: 1, status: 1 });
roomSchema.index({ property: 1, basePrice: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;