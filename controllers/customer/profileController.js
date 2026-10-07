import Customer from "../../models/customer/Customer.js";
import CustomerProfile from "../../models/customer/CustomerProfile.js";
import CustomerPreference from "../../models/customer/CustomerPreference.js";
import { uploadFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const [customer, profile, preference] = await Promise.all([
    Customer.findById(req.customer._id).lean(),
    CustomerProfile.findOne({ customer: req.customer._id }).lean(),
    CustomerPreference.findOne({ customer: req.customer._id }).lean(),
  ]);

  const safe = { ...customer };
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, { customer: safe, profile, preference }));
});

const update = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, gender, nationality, town, location,
  } = req.body;

  const customer = await Customer.findById(req.customer._id);
  if (firstName !== undefined) customer.firstName = firstName;
  if (lastName !== undefined) customer.lastName = lastName;
  if (dateOfBirth !== undefined) customer.dateOfBirth = dateOfBirth;
  if (gender !== undefined) customer.gender = gender;
  if (nationality !== undefined) customer.nationality = nationality;
  if (town !== undefined) customer.town = town;
  if (location !== undefined) customer.location = location;
  await customer.save();

  const safe = customer.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, safe, "Profile updated"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await CustomerProfile.findOneAndUpdate(
    { customer: req.customer._id },
    { $set: req.body },
    { upsert: true, new: true }
  );
  res.status(200).json(new ApiResponse(200, profile, "Profile details updated"));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preference = await CustomerPreference.findOneAndUpdate(
    { customer: req.customer._id },
    { $set: req.body },
    { upsert: true, new: true }
  );
  res.status(200).json(new ApiResponse(200, preference, "Preferences updated"));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");
  const { url, publicId } = await uploadFile(req.file.buffer, req.file.originalname, "avatars");

  const customer = await Customer.findByIdAndUpdate(
    req.customer._id,
    { avatar: url },
    { new: true }
  );

  res.status(200).json(new ApiResponse(200, { avatar: url, publicId }, "Avatar updated"));
});

export { get, update, updateProfile, updatePreferences, uploadAvatar };