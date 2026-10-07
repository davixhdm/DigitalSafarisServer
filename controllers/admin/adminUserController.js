import Admin from "../../models/admin/Admin.js";
import AdminRole from "../../models/admin/AdminRole.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import crypto from "crypto";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const randomPassword = (len = 14) =>
  crypto.randomBytes(len).toString("base64url").slice(0, len);

const list = asyncHandler(async (req, res) => {
  const items = await Admin.find({ isDeleted: false })
    .populate("role")
    .sort({ createdAt: -1 })
    .lean();

  const safe = items.map((a) => {
    const copy = { ...a };
    delete copy.password;
    delete copy.refreshToken;
    return copy;
  });

  res.status(200).json(new ApiResponse(200, safe));
});

const create = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, roleId } = req.body;

  const exists = await Admin.findOne({ $or: [{ email }, { phone }] });
  if (exists) throw new ApiError(400, "Email or phone already exists");

  const role = await AdminRole.findById(roleId);
  if (!role) throw new ApiError(404, "Role not found");

  const tempPassword = randomPassword(14);

  const admin = await Admin.create({
    firstName,
    lastName,
    email,
    phone,
    password: tempPassword,
    role: role._id,
    status: "active",
  });

  const { branding, settings } = await getContext();
  await emailService.adminInvited(admin, {
    inviter: req.admin,
    tempPassword,
    branding,
    settings,
  });

  const safe = admin.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(201).json(new ApiResponse(201, safe, "Admin created and invited"));
});

const changeRole = asyncHandler(async (req, res) => {
  const { roleId } = req.body;
  const admin = await Admin.findById(req.params.id).populate("role");
  if (!admin) throw new ApiError(404, "Admin not found");

  const role = await AdminRole.findById(roleId);
  if (!role) throw new ApiError(404, "Role not found");

  const oldRole = admin.role?.name || "—";
  admin.role = role._id;
  await admin.save();

  const { branding, settings } = await getContext();
  await emailService.adminRoleChanged(admin, { oldRole, newRole: role.name, branding, settings });

  res.status(200).json(new ApiResponse(200, admin, "Role changed"));
});

const suspend = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  admin.status = "suspended";
  await admin.save();

  const { branding, settings } = await getContext();
  await emailService.adminAccountSuspended(admin, {
    reason: req.body.reason || "Policy violation",
    branding,
    settings,
  });

  res.status(200).json(new ApiResponse(200, admin, "Admin suspended"));
});

const reactivate = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  admin.status = "active";
  await admin.save();

  res.status(200).json(new ApiResponse(200, admin, "Admin reactivated"));
});

const remove = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  admin.isDeleted = true;
  admin.status = "suspended";
  await admin.save();

  res.status(200).json(new ApiResponse(200, null, "Admin deleted"));
});

export { list, create, changeRole, suspend, reactivate, remove };