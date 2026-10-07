import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Location from "../../models/admin/Location.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const getSiteConfig = asyncHandler(async (req, res) => {
  const [branding, generalDoc, socialDoc, aiDoc, locations] = await Promise.all([
    Branding.findOne().lean(),
    SystemSetting.findOne({ key: "general" }).lean(),
    SystemSetting.findOne({ key: "social" }).lean(),
    SystemSetting.findOne({ key: "ai" }).lean(),
    Location.find({ isOperational: true, type: { $in: ["town", "city"] } })
      .select("name slug type county countryCode latitude longitude")
      .sort({ name: 1 })
      .lean(),
  ]);

  const general = generalDoc?.value || {};
  const social = socialDoc?.value || {};
  const ai = aiDoc?.value || {};

  const config = {
    site_name: general.appName || "Digital Safaris",
    site_tagline: general.tagline || "Your journey. One platform.",
    site_description:
      branding?.metaDescription ||
      "DigitalSafaris connects accommodation, food, transportation, and experiences through one digital platform across Kenya.",
    support_email: general.supportEmail || null,
    support_phone: general.supportPhone || null,
    whatsapp_number: general.whatsappNumber || general.supportPhone || null,
    app_links: {
      customer: general.clientUrl || "http://localhost:3000",
      partner_landing: general.partnerUrl
        ? `${general.partnerUrl.replace(/\/$/, "")}/register`
        : "/partner-registration",
      transport_partner: general.partnerUrl
        ? `${general.partnerUrl.replace(/\/$/, "")}/register?type=transport`
        : "/partner-registration?type=transport",
      restaurant_partner: general.partnerUrl
        ? `${general.partnerUrl.replace(/\/$/, "")}/register?type=restaurant`
        : "/partner-registration?type=restaurant",
      accommodation_partner: general.partnerUrl
        ? `${general.partnerUrl.replace(/\/$/, "")}/register?type=accommodation`
        : "/partner-registration?type=accommodation",
    },
    social_links: {
      instagram: social.instagram || null,
      tiktok: social.tiktok || null,
      facebook: social.facebook || null,
      linkedin: social.linkedin || null,
      x: social.x || null,
      youtube: social.youtube || null,
    },
    ai_chat: {
      enabled: ai.enabled !== false,
      name: ai.name || "DigitalSafaris Concierge",
      greeting:
        ai.greeting ||
        "Jambo! Welcome to DigitalSafaris. How can I help you plan your journey or partner your business today?",
      color: ai.color || "#c47c2b",
    },
    site_logo: branding?.logoUrl || branding?.logo || "/logo.png",
    locations,
  };

  res.status(200).json({ config });
});

export { getSiteConfig };