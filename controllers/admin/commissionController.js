import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const DEFAULTS = {
  defaultRate: 10,
  byService: {
    accommodation: 10,
    food: 10,
    transport: 10,
    dinein: 10,
  },
};

const get = asyncHandler(async (req, res) => {
  const doc = await SystemSetting.findOne({ key: "commission" }).lean();
  const value = doc?.value || {};
  res.status(200).json(
    new ApiResponse(200, {
      defaultRate: value.defaultRate ?? DEFAULTS.defaultRate,
      byService: {
        ...DEFAULTS.byService,
        ...(value.byService || {}),
        ...(value.food !== undefined ? { food: value.food } : {}),
        ...(value.transport !== undefined ? { transport: value.transport } : {}),
        ...(value.accommodation !== undefined
          ? { accommodation: value.accommodation }
          : {}),
      },
    })
  );
});

const update = asyncHandler(async (req, res) => {
  const { defaultRate, byService } = req.body;

  const incoming = byService || {};
  const value = {
    defaultRate:
      typeof defaultRate === "number" ? defaultRate : DEFAULTS.defaultRate,
    byService: {
      accommodation:
        typeof incoming.accommodation === "number"
          ? incoming.accommodation
          : DEFAULTS.byService.accommodation,
      food:
        typeof incoming.food === "number"
          ? incoming.food
          : DEFAULTS.byService.food,
      transport:
        typeof incoming.transport === "number"
          ? incoming.transport
          : DEFAULTS.byService.transport,
      dinein:
        typeof incoming.dinein === "number"
          ? incoming.dinein
          : DEFAULTS.byService.dinein,
    },
  };

  const doc = await SystemSetting.findOneAndUpdate(
    { key: "commission" },
    { key: "commission", value, group: "commission", updatedBy: req.admin._id },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, doc.value, "Commission rates updated"));
});

export { get, update };