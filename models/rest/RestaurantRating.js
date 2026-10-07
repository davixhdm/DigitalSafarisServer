import mongoose from "mongoose";

const restaurantRatingSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DineInBooking",
      default: null,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    foodQuality: { type: Number, default: null, min: 1, max: 5 },
    service: { type: Number, default: null, min: 1, max: 5 },
    delivery: { type: Number, default: null, min: 1, max: 5 },
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

restaurantRatingSchema.index({ restaurant: 1, createdAt: -1 });
restaurantRatingSchema.index({ customer: 1 });

const RestaurantRating = mongoose.model("RestaurantRating", restaurantRatingSchema);

export default RestaurantRating;