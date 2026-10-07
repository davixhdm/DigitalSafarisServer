import mongoose from "mongoose";

const adminRoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String, trim: true }],
    isSystem: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

adminRoleSchema.index({ status: 1 });

const AdminRole = mongoose.model("AdminRole", adminRoleSchema);

export default AdminRole;