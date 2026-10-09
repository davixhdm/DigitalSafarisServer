import TransportPartner from "../../models/trans/TransportPartner.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Location from "../../models/admin/Location.js";
import Admin from "../../models/admin/Admin.js";
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
    firstName,
    lastName,
    email,
    phone,
    countryCode,
    password,
    idNumber,
    licenseNumber,
    licenseExpiry,
    town,
    address,
    latitude,
    longitude,
    locationId,
    serviceTypes,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  const finalIdNumber =
    idNumber && String(idNumber).trim().length > 0
      ? idNumber
      : `PENDING-${Date.now().toString(36).toUpperCase()}`;

  const exists = await TransportPartner.findOne({
    $or: [{ email }, { phone }, { idNumber: finalIdNumber }],
  });
  if (exists) throw new ApiError(400, "Email, phone or ID already registered");

  const resolved = locationId ? await Location.findById(locationId).lean() : null;

  const finalTown =
    resolved?.name ||
    (typeof town === "string" && !looksLikeObjectId(town) ? town : "Nairobi");

  const finalAddress =
    address || resolved?.county || resolved?.name || finalTown;

  const finalLat = latitude ?? resolved?.latitude ?? -1.286389;
  const finalLng = longitude ?? resolved?.longitude ?? 36.817223;

  const partner = await TransportPartner.create({
    firstName,
    lastName,
    email: String(email).toLowerCase(),
    phone,
    countryCode: countryCode || "+254",
    password,
    idNumber: finalIdNumber,
    licenseNumber: licenseNumber || null,
    licenseExpiry: licenseExpiry || null,
    town: finalTown,
    address: finalAddress,
    latitude: finalLat,
    longitude: finalLng,
    location: resolved?._id || null,
    serviceTypes: Array.isArray(serviceTypes) ? serviceTypes : ["car"],
    status: "pending",
    isOnline: false,
    isAvailable: false,
  });

  await TransportWallet.create({ partner: partner._id });

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
      partnerType: "transport",
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