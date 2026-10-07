import mongoose from "mongoose";

const customerReviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["restaurant", "transport", "accommodation"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, default: null },
    trip: { type: mongoose.Schema.Types.ObjectId, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: null, trim: true },
    comment: { type: String, default: "" },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "published", "hidden"],
      default: "published",
    },
    reply: {
      message: { type: String, default: null },
      repliedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

customerReviewSchema.index({ targetType: 1, targetId: 1 });
customerReviewSchema.index({ customer: 1, createdAt: -1 });

const CustomerReview = mongoose.model("CustomerReview", customerReviewSchema);

export default CustomerReview;