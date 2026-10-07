import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
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
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    roomsBooked: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    partnerEarnings: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["mpesa", "stripe", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    paymentReference: { type: String, default: null },
    paymentReceipt: { type: String, default: null },
    specialRequests: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "pending",
    },
    confirmedAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
    checkedOutAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "partner", "admin", null],
      default: null,
    },
    cancellationReason: { type: String, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
    qrCode: { type: String, default: null },
    guestNotes: { type: String, default: null },
    partnerNotes: { type: String, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ partner: 1, createdAt: -1 });
bookingSchema.index({ property: 1, checkIn: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;