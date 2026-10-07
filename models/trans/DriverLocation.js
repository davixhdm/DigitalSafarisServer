import mongoose from "mongoose";

const driverLocationSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      required: true,
      unique: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    activeTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    activeDelivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryJob",
      default: null,
    },
    town: { type: String, default: null, trim: true },
    lastPingAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

driverLocationSchema.index({ latitude: 1, longitude: 1 });
driverLocationSchema.index({ isOnline: 1, isAvailable: 1 });
driverLocationSchema.index({ lastPingAt: 1 }, { expireAfterSeconds: 86400 });

const DriverLocation = mongoose.model("DriverLocation", driverLocationSchema);

export default DriverLocation;