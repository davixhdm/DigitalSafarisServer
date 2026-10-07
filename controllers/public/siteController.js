import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Legal from "../../models/admin/Legal.js";
import PaymentMethod from "../../models/admin/PaymentMethod.js";
import Location from "../../models/admin/Location.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const PUBLIC_SETTING_KEYS = [
  "general",
  "broadcast",
  "payment",
];

const getSite = asyncHandler(async (req, res) => {
  const [branding, settings, paymentMethods, locations] = await Promise.all([
    Branding.findOne().lean(),
    SystemSetting.find({ key: { $in: PUBLIC_SETTING_KEYS } }).lean(),
    PaymentMethod.find({ enabled: true }).select("name label usedFor").lean(),
    Location.find({ isOperational: true, type: { $in: ["town", "city"] } })
      .select("name slug type county countryCode latitude longitude")
      .sort({ name: 1 })
      .lean(),
  ]);

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const general = settingsMap.general || {};

  const safeGeneral = {
    appName: general.appName || "Digital Safaris",
    apiUrl: general.apiUrl || null,
    clientUrl: general.clientUrl || null,
    adminUrl: general.adminUrl || null,
    partnerUrl: general.partnerUrl || null,
    websiteUrl: general.websiteUrl || null,
    timezone: general.timezone || "Africa/Nairobi",
    currency: general.currency || "KES",
    language: general.language || "en",
    supportEmail: general.supportEmail || null,
    supportPhone: general.supportPhone || null,
    logoUrl: general.logoUrl || null,
  };

  res.status(200).json(
    new ApiResponse(200, {
      branding: branding || {},
      general: safeGeneral,
      broadcast: settingsMap.broadcast || { radiusKm: 5, expirySeconds: 60 },
      payment: settingsMap.payment || {},
      paymentMethods,
      locations,
    })
  );
});

const getBranding = asyncHandler(async (req, res) => {
  const branding = await Branding.findOne().lean();
  res.status(200).json(new ApiResponse(200, branding || {}));
});

const getLegal = asyncHandler(async (req, res) => {
  const items = await Legal.find({ status: "active" })
    .select("type title content version updatedAt")
    .lean();
  res.status(200).json(new ApiResponse(200, items));
});

const getLegalByType = asyncHandler(async (req, res) => {
  const item = await Legal.findOne({ type: req.params.type, status: "active" })
    .select("type title content version updatedAt")
    .lean();
  if (!item) throw new ApiError(404, "Legal document not found");
  res.status(200).json(new ApiResponse(200, item));
});

export { getSite, getBranding, getLegal, getLegalByType };