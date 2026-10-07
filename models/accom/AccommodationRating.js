import mongoose from "mongoose";

const accommodationRatingSchema = new mongoose.Schema(
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
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, default: null, min: 1, max: 5 },
    comfort: { type: Number, default: null, min: 1, max: 5 },
    location: { type: Number, default: null, min: 1, max: 5 },
    service: { type: Number, default: null, min: 1, max: 5 },
    value: { type: Number, default: null, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: [{ type: String }],
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },
    reply: {
      message: { type: String, default: null },
      repliedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

accommodationRatingSchema.index({ partner: 1, createdAt: -1 });
accommodationRatingSchema.index({ property: 1, createdAt: -1 });
accommodationRatingSchema.index({ customer: 1 });

const AccommodationRating = mongoose.model("AccommodationRating", accommodationRatingSchema);

export default AccommodationRating;