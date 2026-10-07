import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Location from "../../models/admin/Location.js";
import { slugify } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const resolveLocation = async (towns) => {
  const ids = Array.isArray(towns) ? towns.filter(Boolean) : [];
  if (ids.length === 0) return null;
  return Location.findById(ids[0]).lean();
};

const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    countryCode,
    password,
    town,
    address,
    latitude,
    longitude,
    locationId,
    description,
    type,
    amenities,
  } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  const exists = await AccommodationPartner.findOne({
    $or: [{ email }, { phone }, { name }],
  });
  if (exists) throw new ApiError(400, "Email, phone or name already registered");

  const resolved = locationId ? await Location.findById(locationId).lean() : null;

  const finalTown =
    resolved?.name ||
    (typeof town === "string" && town.length < 60 && !/^[a-f0-9]{24}$/i.test(town)
      ? town
      : "Nairobi");

  const finalAddress =
    address ||
    resolved?.county ||
    resolved?.name ||
    finalTown;

  const finalLat = latitude ?? resolved?.latitude ?? -1.286389;
  const finalLng = longitude ?? resolved?.longitude ?? 36.817223;

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const partner = await AccommodationPartner.create({
    name,
    slug,
    email: String(email).toLowerCase(),
    phone,
    countryCode: countryCode || "+254",
    password,
    town: finalTown,
    address: finalAddress,
    latitude: finalLat,
    longitude: finalLng,
    location: resolved?._id || null,
    description: description || "",
    type: type || "hotel",
    amenities: amenities || [],
    status: "pending",
  });

  await AccommodationWallet.create({ partner: partner._id });

  const { branding, settings } = await getContext();
  try {
    await emailService.partnerApplicationReceived(partner, {
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Partner notification failed", {
      email,
      error: err.message,
    });
  }

  res.status(201).json({
    success: true,
    message: "Application submitted. We will review it within 24-48 hours.",
    data: { partnerId: partner._id },
  });
});

export { register };