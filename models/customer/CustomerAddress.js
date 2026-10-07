import mongoose from "mongoose";

const customerAddressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["home", "work", "accommodation", "other"],
      default: "other",
    },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: null, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: null, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, default: null, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerAddressSchema.index({ customer: 1, isDefault: 1 });

const CustomerAddress = mongoose.model("CustomerAddress", customerAddressSchema);

export default CustomerAddress;