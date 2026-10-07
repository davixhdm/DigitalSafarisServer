import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      required: true,
    },
    type: {
      type: String,
      enum: ["bike", "car", "van", "truck", "bus", "boat"],
      required: true,
    },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    color: { type: String, required: true, trim: true },
    plateNumber: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    photos: [{ type: String }],
    insuranceNumber: { type: String, default: null, trim: true },
    insuranceExpiry: { type: Date, default: null },
    inspectionExpiry: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending",
    },
    isDefault: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

vehicleSchema.index({ partner: 1, status: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;