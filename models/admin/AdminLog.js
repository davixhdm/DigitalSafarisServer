import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceId: { type: String, default: null },
    description: { type: String, default: "" },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ resource: 1, resourceId: 1 });

const AdminLog = mongoose.model("AdminLog", adminLogSchema);

export default AdminLog;