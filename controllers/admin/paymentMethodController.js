import PaymentMethod from "../../models/admin/PaymentMethod.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const DEFAULTS = [
  {
    name: "mpesa",
    label: "M-Pesa",
    enabled: false,
    usedFor: ["accommodation", "restaurant", "transport", "dinein"],
    config: {},
  },
  {
    name: "stripe",
    label: "Card (Stripe)",
    enabled: false,
    usedFor: ["accommodation"],
    config: {},
  },
  {
    name: "wallet",
    label: "DS Wallet",
    enabled: true,
    usedFor: ["accommodation", "restaurant", "transport", "dinein"],
    config: {},
  },
];

const ensureDefaults = async () => {
  for (const d of DEFAULTS) {
    await PaymentMethod.updateOne(
      { name: d.name },
      { $setOnInsert: d },
      { upsert: true }
    );
  }
};

const list = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const methods = await PaymentMethod.find().sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, methods));
});

const toggle = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const { name } = req.params;
  const { enabled } = req.body;

  const method = await PaymentMethod.findOne({ name });
  if (!method) throw new ApiError(404, "Payment method not found");

  method.enabled = Boolean(enabled);
  method.updatedBy = req.admin._id;
  await method.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        method,
        `${method.label} ${enabled ? "enabled" : "disabled"}`
      )
    );
});

const updateUsedFor = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const { name } = req.params;
  const { usedFor } = req.body;

  if (!Array.isArray(usedFor)) {
    throw new ApiError(400, "usedFor must be an array");
  }

  const method = await PaymentMethod.findOne({ name });
  if (!method) throw new ApiError(404, "Payment method not found");

  method.usedFor = usedFor;
  method.updatedBy = req.admin._id;
  await method.save();

  res.status(200).json(new ApiResponse(200, method, "Used-for updated"));
});

const updateConfig = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const { name } = req.params;
  const { config } = req.body;

  const method = await PaymentMethod.findOne({ name });
  if (!method) throw new ApiError(404, "Payment method not found");

  method.config = { ...method.config, ...config };
  method.updatedBy = req.admin._id;
  await method.save();

  res.status(200).json(new ApiResponse(200, method, "Config updated"));
});

export { list, toggle, updateUsedFor, updateConfig };