import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Location from "../../models/admin/Location.js";
import Admin from "../../models/admin/Admin.js";
import { slugify } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const looksLikeObjectId = (v) =>
  typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

const getAdminRecipients = async () => {
  return Admin.find({ isDeleted: false, status: "active" })
    .select("firstName lastName email")
    .lean();
};

const notifyAdminsOfPartnerApplication = async ({
  partner,
  partnerType,
  branding,
  settings,
}) => {
  const admins = await getAdminRecipients();

  if (!admins.length) {
    logger.warn("No active admins to notify for partner application", {
      partnerType,
      partnerEmail: partner.email,
    });
    return;
  }

  const results = await Promise.allSettled(
    admins.map((admin) =>
      emailService.adminNewPartnerApplication(admin, {
        branding,
        settings,
        partnerType,
        partner,
      })
    )
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      logger.error("Admin partner-application email failed", {
        adminEmail: admins[i].email,
        partnerType,
        error: r.reason?.message,
      });
    }
  });
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
    cuisineTypes,
  } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  const exists = await RestaurantPartner.findOne({
    $or: [{ email }, { phone }, { name }],
  });
  if (exists) throw new ApiError(400, "Email, phone or name already registered");

  const resolved = locationId ? await Location.findById(locationId).lean() : null;

  const finalTown =
    resolved?.name ||
    (typeof town === "string" && !looksLikeObjectId(town) ? town : "Nairobi");

  const finalAddress =
    address || resolved?.county || resolved?.name || finalTown;

  const finalLat = latitude ?? resolved?.latitude ?? -1.286389;
  const finalLng = longitude ?? resolved?.longitude ?? 36.817223;

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const partner = await RestaurantPartner.create({
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
    cuisineTypes: Array.isArray(cuisineTypes) ? cuisineTypes : [],
    status: "pending",
    isOpen: false,
    isAcceptingOrders: false,
  });

  await RestaurantWallet.create({ restaurant: partner._id });

  const { branding, settings } = await getContext();

  // Applicant email
  try {
    await emailService.partnerApplicationReceived(partner, {
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Applicant email failed", { email, error: err.message });
  }

  // Applicant SMS
  try {
    await smsService.partnerApplicationReceived(partner, {});
  } catch (err) {
    logger.error("Applicant SMS failed", { email, error: err.message });
  }

  // Admin notifications
  try {
    await notifyAdminsOfPartnerApplication({
      partner,
      partnerType: "restaurant",
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Admin notification failed", { email, error: err.message });
  }

  res.status(201).json({
    success: true,
    message: "Application submitted. We will review it within 24-48 hours.",
    data: { partnerId: partner._id },
  });
});

export { register };