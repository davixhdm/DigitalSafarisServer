import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import { uploadFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const get = asyncHandler(async (req, res) => {
  const [partner, wallet] = await Promise.all([
    RestaurantPartner.findById(req.partner._id).lean(),
    RestaurantWallet.findOne({ restaurant: req.partner._id }).lean(),
  ]);

  if (!partner) throw new ApiError(404, "Restaurant not found");

  const safe = { ...partner };
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, { partner: safe, wallet }));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "cuisineTypes",
    "phone",
    "countryCode",
    "town",
    "address",
    "latitude",
    "longitude",
    "businessHours",
    "supportsDelivery",
    "supportsDineIn",
    "supportsPickup",
    "deliveryRadiusKm",
    "minimumOrder",
    "deliveryFee",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const partner = await RestaurantPartner.findByIdAndUpdate(
    req.partner._id,
    { $set: updates },
    { new: true }
  );

  if (!partner) throw new ApiError(404, "Restaurant not found");

  const safe = partner.toObject();
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(new ApiResponse(200, safe, "Profile updated"));
});

const toggleOpen = asyncHandler(async (req, res) => {
  const { isOpen } = req.body;

  const partner = await RestaurantPartner.findByIdAndUpdate(
    req.partner._id,
    {
      $set: {
        isOpen: Boolean(isOpen),
        isAcceptingOrders: Boolean(isOpen),
      },
    },
    { new: true }
  );

  if (!partner) throw new ApiError(404, "Restaurant not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isOpen: partner.isOpen, isAcceptingOrders: partner.isAcceptingOrders },
        partner.isOpen ? "Restaurant opened" : "Restaurant closed"
      )
    );
});

const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "restaurants/logos"
  );

  await RestaurantPartner.updateOne(
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
    "restaurants/covers"
  );

  await RestaurantPartner.updateOne(
    { _id: req.partner._id },
    { $set: { coverImage: url } }
  );

  res.status(200).json(new ApiResponse(200, { coverImage: url, publicId }, "Cover updated"));
});

export { get, update, toggleOpen, uploadLogo, uploadCover };