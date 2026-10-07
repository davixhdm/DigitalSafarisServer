import TransportPartner from "../../models/trans/TransportPartner.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import { uploadFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const [partner, wallet] = await Promise.all([
    TransportPartner.findById(req.partner._id).lean(),
    TransportWallet.findOne({ partner: req.partner._id }).lean(),
  ]);

  if (!partner) throw new ApiError(404, "Partner not found");

  const safe = { ...partner };
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, { partner: safe, wallet }));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "firstName",
    "lastName",
    "phone",
    "countryCode",
    "licenseNumber",
    "licenseExpiry",
    "town",
    "address",
    "latitude",
    "longitude",
    "serviceTypes",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const partner = await TransportPartner.findByIdAndUpdate(
    req.partner._id,
    { $set: updates },
    { new: true }
  );

  if (!partner) throw new ApiError(404, "Partner not found");

  const safe = partner.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, safe, "Profile updated"));
});

const goOnline = asyncHandler(async (req, res) => {
  const partner = await TransportPartner.findByIdAndUpdate(
    req.partner._id,
    { $set: { isOnline: true, isAvailable: true, status: "active" } },
    { new: true }
  );

  if (!partner) throw new ApiError(404, "Partner not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOnline: partner.isOnline, isAvailable: partner.isAvailable },
        "You are online"
      )
    );
});

const goOffline = asyncHandler(async (req, res) => {
  const partner = await TransportPartner.findByIdAndUpdate(
    req.partner._id,
    { $set: { isOnline: false, isAvailable: false } },
    { new: true }
  );

  if (!partner) throw new ApiError(404, "Partner not found");

  const DriverLocation = (await import("../../models/trans/DriverLocation.js")).default;
  await DriverLocation.updateOne(
    { partner: partner._id },
    { $set: { isOnline: false, isAvailable: false } }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOnline: partner.isOnline, isAvailable: partner.isAvailable },
        "You are offline"
      )
    );
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "transport/avatars"
  );

  await TransportPartner.updateOne(
    { _id: req.partner._id },
    { $set: { avatar: url } }
  );

  res.status(200).json(new ApiResponse(200, { avatar: url, publicId }, "Avatar updated"));
});

export { get, update, goOnline, goOffline, uploadAvatar };