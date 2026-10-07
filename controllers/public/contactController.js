import Contact from "../../models/admin/Contact.js";
import Admin from "../../models/admin/Admin.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const submit = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const contact = await Contact.create({
    name,
    email: email.toLowerCase(),
    phone: phone || null,
    subject,
    message,
    status: "new",
  });

  const { branding, settings } = await getContext();

  const admins = await Admin.find({
    status: "active",
    isDeleted: false,
  }).select("firstName lastName email");

  for (const admin of admins) {
    try {
      await emailService.adminNewContact(admin, {
        contact,
        branding,
        settings,
      });
    } catch {
      /* swallow */
    }
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id: contact._id },
        "Message received. We will get back to you shortly."
      )
    );
});

export { submit };