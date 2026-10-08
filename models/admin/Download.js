import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["windows", "macos", "linux", "android", "ios", "web", "other"],
      required: true,
    },
    architecture: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    minimumOs: { type: String, default: null, trim: true },
    checksum: { type: String, default: null, trim: true },
    releaseNotes: { type: String, default: null },
    available: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

downloadSchema.index({ platform: 1, available: 1 });
downloadSchema.index({ name: 1 });

const Download = mongoose.model("Download", downloadSchema);

export default Download;