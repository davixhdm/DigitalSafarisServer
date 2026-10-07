import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import { uploadFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const [partner, wallet] = await Promise.all([
    AccommodationPartner.findById(req.partner._id).lean(),
    AccommodationWallet.findOne({ partner: req.partner._id }).lean(),
  ]);

  if (!partner) throw new ApiError(404, "Partner not found");

  const safe = { ...partner };
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, { partner: safe, wallet }));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "type",
    "phone",
    "countryCode",
    "town",
    "address",
    "latitude",
    "longitude",
    "amenities",
    "checkInTime",
    "checkOutTime",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const partner = await AccommodationPartner.findByIdAndUpdate(
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

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "accommodations/logos"
  );

  await AccommodationPartner.updateOne(
    { _id: req.partner._id },
    { $set: { logo: url } }
  );

  res.status(200).json(new ApiResponse(200, { logo: url, publicId }, "Logo updated"));
});

const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "accommodations/covers"
  );

  await AccommodationPartner.updateOne(
    { _id: req.partner._id },
    { $set: { coverImage: url } }
  );

  res.status(200).json(new ApiResponse(200, { coverImage: url, publicId }, "Cover updated"));
});

export { get, update, uploadLogo, uploadCover };