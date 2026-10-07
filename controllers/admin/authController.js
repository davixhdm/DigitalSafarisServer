import Admin from "../../models/admin/Admin.js";
import AdminRole from "../../models/admin/AdminRole.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import comparePassword from "../../utils/comparePassword.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/generateToken.js";
import * as emailService from "../../services/emailService.js";

const getBrandingAndSettings = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email, isDeleted: false })
    .select("+password")
    .populate("role");

  if (!admin) throw new ApiError(401, "Invalid credentials");
  if (admin.status === "suspended") throw new ApiError(403, "Account suspended");

  const match = await comparePassword(password, admin.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  const accessToken = generateAccessToken({ id: admin._id, type: "admin" });
  const refreshToken = generateRefreshToken({ id: admin._id, type: "admin" });

  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save();

  const safe = admin.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, { admin: safe, accessToken, refreshToken }, "Login successful"));
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);
  const admin = await Admin.findById(decoded.id).populate("role");
  if (!admin || admin.isDeleted) throw new ApiError(401, "Invalid session");
  if (admin.refreshToken !== refreshToken) throw new ApiError(401, "Session revoked");

  const accessToken = generateAccessToken({ id: admin._id, type: "admin" });
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

const logout = asyncHandler(async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { $set: { refreshToken: null } });
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

const me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).populate("role");
  const safe = admin.toObject();
  delete safe.password;
  delete safe.refreshToken;
  res.status(200).json(new ApiResponse(200, safe, "Profile fetched"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select("+password");
  const match = await comparePassword(currentPassword, admin.password);
  if (!match) throw new ApiError(400, "Current password incorrect");

  admin.password = newPassword;
  await admin.save();

  const { branding, settings } = await getBrandingAndSettings();
  await emailService.passwordChanged(admin, { branding, settings });

  res.status(200).json(new ApiResponse(200, null, "Password changed"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email, isDeleted: false });

  if (admin) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;
    admin.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    const { branding, settings } = await getBrandingAndSettings();
    await emailService.passwordResetOTP(admin, { otp, branding, settings });
  }

  res.status(200).json(new ApiResponse(200, null, "If the email exists, a reset code was sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const admin = await Admin.findOne({ email, isDeleted: false }).select("+password");
  if (!admin) throw new ApiError(400, "Invalid request");
  if (!admin.resetOtp || admin.resetOtp !== otp) throw new ApiError(400, "Invalid OTP");
  if (admin.resetOtpExpires < new Date()) throw new ApiError(400, "OTP expired");

  admin.password = newPassword;
  admin.resetOtp = null;
  admin.resetOtpExpires = null;
  await admin.save();

  const { branding, settings } = await getBrandingAndSettings();
  await emailService.passwordChanged(admin, { branding, settings });

  res.status(200).json(new ApiResponse(200, null, "Password reset"));
});

export { login, refresh, logout, me, changePassword, forgotPassword, resetPassword };