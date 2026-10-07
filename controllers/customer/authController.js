import Customer from "../../models/customer/Customer.js";
import CustomerSession from "../../models/customer/CustomerSession.js";
import CustomerOTP from "../../models/customer/CustomerOTP.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import generateOTP from "../../utils/generateOTP.js";
import comparePassword from "../../utils/comparePassword.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/generateToken.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const customer = await Customer.findOne({ email, isDeleted: false }).select("+password");
  if (!customer) throw new ApiError(401, "Invalid credentials");
  if (customer.status === "suspended") throw new ApiError(403, "Account suspended");

  const match = await comparePassword(password, customer.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  const accessToken = generateAccessToken({ id: customer._id, type: "customer" });
  const refreshToken = generateRefreshToken({ id: customer._id, type: "customer" });

  customer.refreshToken = refreshToken;
  customer.lastLogin = new Date();
  await customer.save();

  await CustomerSession.create({
    customer: customer._id,
    refreshToken,
    device: req.headers["user-agent"] || null,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const safe = customer.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(
    new ApiResponse(200, { customer: safe, accessToken, refreshToken }, "Login successful")
  );
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);
  const session = await CustomerSession.findOne({ refreshToken, revokedAt: null });
  if (!session) throw new ApiError(401, "Session revoked");

  const customer = await Customer.findById(decoded.id);
  if (!customer || customer.isDeleted) throw new ApiError(401, "Invalid session");
  if (customer.status === "suspended") throw new ApiError(403, "Account suspended");

  const accessToken = generateAccessToken({ id: customer._id, type: "customer" });
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

const logout = asyncHandler(async (req, res) => {
  await Customer.updateOne({ _id: req.customer._id }, { $set: { refreshToken: null } });
  await CustomerSession.updateMany(
    { customer: req.customer._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

const me = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer._id).lean();
  const safe = { ...customer };
  delete safe.password;
  delete safe.refreshToken;
  res.status(200).json(new ApiResponse(200, safe, "Profile fetched"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const customer = await Customer.findById(req.customer._id).select("+password");
  const match = await comparePassword(currentPassword, customer.password);
  if (!match) throw new ApiError(400, "Current password incorrect");

  customer.password = newPassword;
  await customer.save();

  const { branding, settings } = await getContext();
  await emailService.passwordChanged(customer, { branding, settings });
  await smsService.passwordChanged(customer, {});

  res.status(200).json(new ApiResponse(200, null, "Password changed"));
});

const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail, password } = req.body;

  const customer = await Customer.findById(req.customer._id).select("+password");
  const match = await comparePassword(password, customer.password);
  if (!match) throw new ApiError(400, "Password incorrect");

  const exists = await Customer.findOne({ email: newEmail });
  if (exists) throw new ApiError(400, "Email already in use");

  const otp = generateOTP(6);
  await CustomerOTP.create({
    customer: customer._id,
    identifier: newEmail,
    code: otp,
    purpose: "verify_email",
    channel: "email",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const { branding, settings } = await getContext();
  await emailService.changeContactOTP(customer, { otp, type: "email", branding, settings });

  res.status(200).json(new ApiResponse(200, { pendingEmail: newEmail }, "Verification code sent"));
});

const confirmChangeEmail = asyncHandler(async (req, res) => {
  const { newEmail, otp } = req.body;

  const record = await CustomerOTP.findOne({
    identifier: newEmail,
    purpose: "verify_email",
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) throw new ApiError(400, "No pending change");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired");
  if (record.code !== otp) throw new ApiError(400, "Invalid OTP");

  record.verified = true;
  await record.save();

  const customer = await Customer.findById(req.customer._id);
  customer.email = newEmail;
  customer.emailVerified = true;
  await customer.save();

  res.status(200).json(new ApiResponse(200, null, "Email changed"));
});

const changePhone = asyncHandler(async (req, res) => {
  const { newPhone, password } = req.body;

  const customer = await Customer.findById(req.customer._id).select("+password");
  const match = await comparePassword(password, customer.password);
  if (!match) throw new ApiError(400, "Password incorrect");

  const exists = await Customer.findOne({ phone: newPhone });
  if (exists) throw new ApiError(400, "Phone already in use");

  const otp = generateOTP(6);
  await CustomerOTP.create({
    customer: customer._id,
    identifier: newPhone,
    code: otp,
    purpose: "verify_phone",
    channel: "sms",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await smsService.changeContactOTP(customer, { otp, type: "phone" });

  res.status(200).json(new ApiResponse(200, { pendingPhone: newPhone }, "Verification code sent"));
});

const confirmChangePhone = asyncHandler(async (req, res) => {
  const { newPhone, otp } = req.body;

  const record = await CustomerOTP.findOne({
    identifier: newPhone,
    purpose: "verify_phone",
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) throw new ApiError(400, "No pending change");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired");
  if (record.code !== otp) throw new ApiError(400, "Invalid OTP");

  record.verified = true;
  await record.save();

  const customer = await Customer.findById(req.customer._id);
  customer.phone = newPhone;
  customer.phoneVerified = true;
  await customer.save();

  res.status(200).json(new ApiResponse(200, null, "Phone changed"));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const customer = await Customer.findById(req.customer._id).select("+password");
  const match = await comparePassword(password, customer.password);
  if (!match) throw new ApiError(400, "Password incorrect");

  customer.status = "suspended";
  await customer.save();

  const { branding, settings } = await getContext();
  await emailService.accountDeletionScheduled(customer, {
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString(),
    branding,
    settings,
  });

  res.status(200).json(new ApiResponse(200, null, "Account scheduled for deletion"));
});

export {
  login,
  refresh,
  logout,
  me,
  changePassword,
  changeEmail,
  confirmChangeEmail,
  changePhone,
  confirmChangePhone,
  deleteAccount,
};