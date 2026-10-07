import Contact from "../../models/admin/Contact.js";
import Admin from "../../models/admin/Admin.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const submit = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "name, email and message are required" });
  }

  const contact = await Contact.create({
    name,
    email: String(email).toLowerCase(),
    phone: phone || null,
    subject: subject || "general",
    message,
    status: "new",
  });

  const { branding, settings } = await getContext();
  const admins = await Admin.find({ status: "active", isDeleted: false }).select(
    "firstName lastName email"
  );

  for (const admin of admins) {
    try {
      await emailService.adminNewContact(admin, { contact, branding, settings });
    } catch (err) {
      logger.error("Contact notification failed", {
        admin: admin.email,
        error: err.message,
      });
    }
  }

  res.status(200).json({ success: true, id: contact._id });
});

export { submit };