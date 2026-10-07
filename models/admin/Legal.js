import mongoose from "mongoose";

const legalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["terms", "privacy", "cookies"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    version: { type: String, default: "1.0" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

const Legal = mongoose.model("Legal", legalSchema);

export default Legal;