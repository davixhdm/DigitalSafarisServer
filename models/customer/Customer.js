import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    countryCode: { type: String, default: "+254", trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    nationality: { type: String, default: null, trim: true },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    town: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["active", "suspended", "pending", "verified"],
      default: "pending",
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, select: false, default: null },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

customerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

customerSchema.index({ isDeleted: 1, status: 1 });
customerSchema.index({ location: 1 });
customerSchema.index({ town: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;