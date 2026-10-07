import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    countryCode: { type: String, default: null, trim: true },
    nationality: { type: String, default: null, trim: true },
    idType: {
      type: String,
      enum: ["national_id", "passport", "driver_license", null],
      default: null,
    },
    idNumber: { type: String, default: null, trim: true },
    isPrimary: { type: Boolean, default: false },
    age: { type: Number, default: null, min: 0 },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

guestSchema.index({ booking: 1 });
guestSchema.index({ partner: 1, createdAt: -1 });
guestSchema.index({ customer: 1 });

const Guest = mongoose.model("Guest", guestSchema);

export default Guest;