import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    group: {
      type: String,
      enum: ["general", "commission", "payout", "broadcast", "payment", "legal", "branding"],
      default: "general",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

systemSettingSchema.index({ group: 1 });

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);

export default SystemSetting;