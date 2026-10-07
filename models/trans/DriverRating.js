import mongoose from "mongoose";

const driverRatingSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportPartner",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },
    deliveryJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryJob",
      default: null,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },
  },
  { timestamps: true }
);

driverRatingSchema.index({ partner: 1, createdAt: -1 });
driverRatingSchema.index({ customer: 1 });

const DriverRating = mongoose.model("DriverRating", driverRatingSchema);

export default DriverRating;