import Customer from "../../models/customer/Customer.js";
import CustomerProfile from "../../models/customer/CustomerProfile.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPreference from "../../models/customer/CustomerPreference.js";
import CustomerOTP from "../../models/customer/CustomerOTP.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import generateOTP from "../../utils/generateOTP.js";
import comparePassword from "../../utils/comparePassword.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerifyToken,
  verifyEmailVerifyToken,
} from "../../utils/generateToken.js";
import { generateRef, slugify } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const buildVerifyUrl = (token, settings) => {
  const base =
    settings.clientUrl ||
    process.env.CLIENT_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify-email?token=${token}`;
};

const registerCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, countryCode, password, town } = req.body;

  const exists = await Customer.findOne({ $or: [{ email }, { phone }] });
  if (exists) throw new ApiError(400, "Email or phone already registered");

  const referralCode = generateRef("REF").slice(0, 10);

  const customer = await Customer.create({
    firstName,
    lastName,
    email,
    phone,
    countryCode: countryCode || "+254",
    password,
    town: town || null,
    referralCode,
    status: "pending",
    emailVerified: false,
  });

  await CustomerProfile.create({ customer: customer._id, town: town || null });
  await CustomerWallet.create({ customer: customer._id });
  await CustomerPreference.create({ customer: customer._id });

  const token = generateEmailVerifyToken({ id: customer._id.toString() });
  const { branding, settings } = await getContext();
  const link = buildVerifyUrl(token, settings);

  try {
    await emailService.emailVerificationLink(customer, {
      link,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Verification email failed", { email, error: err.message });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { customerId: customer._id },
      "Account created. Check your email to verify your account."
    )
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, "Verification token required");

  let decoded;
  try {
    decoded = verifyEmailVerifyToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired verification link");
  }

  if (decoded.purpose !== "verify_email") {
    throw new ApiError(400, "Invalid token purpose");
  }

  const customer = await Customer.findById(decoded.id);
  if (!customer || customer.isDeleted) {
    throw new ApiError(404, "Customer not found");
  }

  if (customer.emailVerified && customer.status === "active") {
    return res
      .status(200)
      .json(new ApiResponse(200, { alreadyVerified: true }, "Email already verified"));
  }

  customer.emailVerified = true;
  customer.status = "active";
  await customer.save();

  const { branding, settings } = await getContext();
  try {
    await emailService.welcomeCustomer(customer, { branding, settings });
  } catch (err) {
    logger.error("Welcome email failed", {
      email: customer.email,
      error: err.message,
    });
  }

  res.status(200).json(
    new ApiResponse(200, { customerId: customer._id }, "Email verified. Welcome aboard!")
  );
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const customer = await Customer.findOne({ email, isDeleted: false });
  if (!customer) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "If the email exists, a verification link was sent."));
  }

  if (customer.emailVerified && customer.status === "active") {
    throw new ApiError(400, "Email already verified");
  }

  const token = generateEmailVerifyToken({ id: customer._id.toString() });
  const { branding, settings } = await getContext();
  const link = buildVerifyUrl(token, settings);

  try {
    await emailService.emailVerificationLink(customer, {
      link,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Verification email failed", {
      email,
      error: err.message,
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "If the email exists, a verification link was sent."));
});

const loginCustomer = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const customer = await Customer.findOne({ email, isDeleted: false }).select(
    "+password"
  );
  if (!customer) throw new ApiError(401, "Invalid credentials");
  if (customer.status === "suspended") throw new ApiError(403, "Account suspended");

  const match = await comparePassword(password, customer.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  if (!customer.emailVerified || customer.status === "pending") {
    throw new ApiError(
      403,
      "Email not verified. Check your inbox for the verification link."
    );
  }

  const accessToken = generateAccessToken({ id: customer._id, type: "customer" });
  const refreshToken = generateRefreshToken({ id: customer._id, type: "customer" });

  customer.refreshToken = refreshToken;
  customer.lastLogin = new Date();
  await customer.save();

  const safe = customer.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(
    new ApiResponse(
      200,
      { customer: safe, accessToken, refreshToken },
      "Login successful"
    )
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const customer = await Customer.findOne({ email, isDeleted: false });

  if (customer) {
    const otp = generateOTP(6);
    await CustomerOTP.create({
      customer: customer._id,
      identifier: email,
      code: otp,
      purpose: "reset_password",
      channel: "email",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      const { branding, settings } = await getContext();
      await emailService.passwordResetOTP(customer, { otp, branding, settings });
    } catch (err) {
      logger.error("Password reset email failed", {
        email,
        error: err.message,
      });
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "If the email exists, a reset code was sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const customer = await Customer.findOne({ email, isDeleted: false }).select("+password");
  if (!customer) throw new ApiError(400, "Invalid request");

  const record = await CustomerOTP.findOne({
    identifier: email,
    purpose: "reset_password",
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) throw new ApiError(400, "No pending reset");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired");
  if (record.code !== otp) throw new ApiError(400, "Invalid OTP");

  record.verified = true;
  await record.save();

  customer.password = newPassword;
  await customer.save();

  try {
    const { branding, settings } = await getContext();
    await emailService.passwordChanged(customer, { branding, settings });
    await smsService.passwordChanged(customer, {});
  } catch (err) {
    logger.error("Password changed notification failed", {
      email,
      error: err.message,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "Password reset"));
});

const sendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const customer = await Customer.findOne({ phone, isDeleted: false });
  if (!customer) throw new ApiError(404, "Customer not found");

  const otp = generateOTP(6);
  await CustomerOTP.create({
    customer: customer._id,
    identifier: phone,
    code: otp,
    purpose: "verify_phone",
    channel: "sms",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    await smsService.phoneVerificationOTP(customer, { otp });
  } catch (err) {
    logger.error("Phone OTP SMS failed", { phone, error: err.message });
  }

  res.status(200).json(new ApiResponse(200, null, "SMS code sent"));
});

const verifyPhone = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const customer = await Customer.findOne({ phone, isDeleted: false });
  if (!customer) throw new ApiError(404, "Customer not found");

  const record = await CustomerOTP.findOne({
    identifier: phone,
    purpose: "verify_phone",
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) throw new ApiError(400, "No pending verification");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired");
  if (record.code !== otp) throw new ApiError(400, "Invalid OTP");

  record.verified = true;
  await record.save();

  customer.phoneVerified = true;
  await customer.save();

  res.status(200).json(new ApiResponse(200, null, "Phone verified"));
});

const registerRestaurant = asyncHandler(async (req, res) => {
  const {
    name, email, phone, countryCode, password,
    town, address, latitude, longitude, locationId,
    description, cuisineTypes,
  } = req.body;

  const exists = await RestaurantPartner.findOne({ $or: [{ email }, { phone }, { name }] });
  if (exists) throw new ApiError(400, "Email, phone or name already registered");

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const partner = await RestaurantPartner.create({
    name,
    slug,
    email,
    phone,
    countryCode: countryCode || "+254",
    password,
    town,
    address,
    latitude,
    longitude,
    location: locationId,
    description: description || "",
    cuisineTypes: cuisineTypes || [],
    status: "pending",
    isOpen: false,
    isAcceptingOrders: false,
  });

  await RestaurantWallet.create({ restaurant: partner._id });

  try {
    const { branding, settings } = await getContext();
    await emailService.partnerApplicationReceived(partner, { branding, settings });
    await smsService.partnerApplicationReceived(partner, {});
  } catch (err) {
    logger.error("Partner notification failed", { email, error: err.message });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { partnerId: partner._id },
      "Application submitted. We will review it within 24-48 hours."
    )
  );
});

const registerTransport = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, email, phone, countryCode, password,
    idNumber, licenseNumber, licenseExpiry,
    town, address, latitude, longitude, locationId,
    serviceTypes,
  } = req.body;

  const exists = await TransportPartner.findOne({ $or: [{ email }, { phone }, { idNumber }] });
  if (exists) throw new ApiError(400, "Email, phone or ID already registered");

  const partner = await TransportPartner.create({
    firstName,
    lastName,
    email,
    phone,
    countryCode: countryCode || "+254",
    password,
    idNumber,
    licenseNumber: licenseNumber || null,
    licenseExpiry: licenseExpiry || null,
    town,
    address: address || null,
    latitude: latitude || null,
    longitude: longitude || null,
    location: locationId,
    serviceTypes: serviceTypes || [],
    status: "pending",
    isOnline: false,
    isAvailable: false,
  });

  await TransportWallet.create({ partner: partner._id });

  try {
    const { branding, settings } = await getContext();
    await emailService.partnerApplicationReceived(partner, { branding, settings });
    await smsService.partnerApplicationReceived(partner, {});
  } catch (err) {
    logger.error("Partner notification failed", { email, error: err.message });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { partnerId: partner._id },
      "Application submitted. We will review it within 24-48 hours."
    )
  );
});

const registerAccommodation = asyncHandler(async (req, res) => {
  const {
    name, email, phone, countryCode, password,
    town, address, latitude, longitude, locationId,
    description, type, amenities,
  } = req.body;

  const exists = await AccommodationPartner.findOne({ $or: [{ email }, { phone }, { name }] });
  if (exists) throw new ApiError(400, "Email, phone or name already registered");

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const partner = await AccommodationPartner.create({
    name,
    slug,
    email,
    phone,
    countryCode: countryCode || "+254",
    password,
    town,
    address,
    latitude,
    longitude,
    location: locationId,
    description: description || "",
    type,
    amenities: amenities || [],
    status: "pending",
  });

  await AccommodationWallet.create({ partner: partner._id });

  try {
    const { branding, settings } = await getContext();
    await emailService.partnerApplicationReceived(partner, { branding, settings });
    await smsService.partnerApplicationReceived(partner, {});
  } catch (err) {
    logger.error("Partner notification failed", { email, error: err.message });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { partnerId: partner._id },
      "Application submitted. We will review it within 24-48 hours."
    )
  );
});

export {
  registerCustomer,
  registerRestaurant,
  registerTransport,
  registerAccommodation,
  verifyEmail,
  resendVerification,
  loginCustomer,
  forgotPassword,
  resetPassword,
  sendPhoneOTP,
  verifyPhone,
};