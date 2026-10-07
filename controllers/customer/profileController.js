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

  res
    .status(200)
    .json(new ApiResponse(200, { customer: safe, profile, preference }));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "nationality",
    "town",
    "location",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const customer = await Customer.findByIdAndUpdate(
    req.customer._id,
    { $set: updates },
    { new: true }
  );

  if (!customer) throw new ApiError(404, "Customer not found");

  const safe = customer.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, safe, "Profile updated"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "bio",
    "language",
    "currency",
    "timezone",
    "town",
    "location",
    "travelInterests",
    "dietaryPreferences",
    "accessibilityNeeds",
    "emergencyContact",
    "marketingOptIn",
    "pushOptIn",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const profile = await CustomerProfile.findOneAndUpdate(
    { customer: req.customer._id },
    { $set: updates, $setOnInsert: { customer: req.customer._id } },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, profile, "Profile details updated"));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const allowed = ["notifications", "categories", "theme", "language", "currency", "favorites"];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const preference = await CustomerPreference.findOneAndUpdate(
    { customer: req.customer._id },
    { $set: updates, $setOnInsert: { customer: req.customer._id } },
    { upsert: true, new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, preference, "Preferences updated"));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    if (req.body && req.body.avatar === null) {
      await Customer.updateOne(
        { _id: req.customer._id },
        { $set: { avatar: null } }
      );
      return res
        .status(200)
        .json(new ApiResponse(200, { avatar: null }, "Avatar removed"));
    }
    throw new ApiError(400, "File required");
  }

  if (!/^image\//.test(req.file.mimetype)) {
    throw new ApiError(400, "Only image files are allowed");
  }

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "avatars"
  );

  const customer = await Customer.findByIdAndUpdate(
    req.customer._id,
    { $set: { avatar: url } },
    { new: true }
  );

  if (!customer) throw new ApiError(404, "Customer not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatar: customer.avatar, publicId },
        "Avatar updated"
      )
    );
});

export { get, update, updateProfile, updatePreferences, uploadAvatar };