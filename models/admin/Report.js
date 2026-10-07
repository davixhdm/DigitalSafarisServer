import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["revenue", "commission", "payout", "partner", "customer", "order", "custom"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    period: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    format: { type: String, enum: ["json", "csv", "pdf"], default: "json" },
    fileUrl: { type: String, default: null },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ type: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;