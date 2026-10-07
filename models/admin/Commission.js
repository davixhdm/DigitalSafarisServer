import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["food", "transport", "accommodation"],
      required: true,
    },
    rate: { type: Number, required: true, min: 0, max: 100 },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    partnerType: {
      type: String,
      enum: ["restaurant", "transport", "accommodation", null],
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "collected", "owed", "offset", "invoiced"],
      default: "pending",
    },
    settledAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

commissionSchema.index({ type: 1, status: 1 });
commissionSchema.index({ partner: 1, status: 1 });
commissionSchema.index({ createdAt: -1 });

const Commission = mongoose.model("Commission", commissionSchema);

export default Commission;