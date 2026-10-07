import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    discountPrice: { type: Number, default: null, min: 0 },
    preparationTimeMinutes: { type: Number, default: 15, min: 1 },
    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    dietary: [{ type: String, trim: true }],
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, menu: 1, status: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ name: "text", description: "text" });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;