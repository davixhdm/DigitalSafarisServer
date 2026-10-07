import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: null },
    category: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuSchema.index({ restaurant: 1, status: 1 });
menuSchema.index({ restaurant: 1, displayOrder: 1 });

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;