import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    size: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["auto", "manual", "upload"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
    },
    path: { type: String, required: true },
    url: { type: String, default: null },
    failureReason: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    restoredAt: { type: Date, default: null },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

backupSchema.index({ status: 1, createdAt: -1 });

const Backup = mongoose.model("Backup", backupSchema);

export default Backup;