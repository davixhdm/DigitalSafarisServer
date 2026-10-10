import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import RestaurantWallet from "../../models/rest/RestaurantWallet.js";
import RestaurantRating from "../../models/rest/RestaurantRating.js";
import Menu from "../../models/rest/Menu.js";
import MenuItem from "../../models/rest/MenuItem.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import DineInBooking from "../../models/rest/DineInBooking.js";
import BroadcastRequest from "../../models/rest/BroadcastRequest.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import Vehicle from "../../models/trans/Vehicle.js";
import Trip from "../../models/trans/Trip.js";
import DeliveryJob from "../../models/trans/DeliveryJob.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import DriverRating from "../../models/trans/DriverRating.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import Booking from "../../models/accom/Booking.js";
import Guest from "../../models/accom/Guest.js";
import AccommodationRating from "../../models/accom/AccommodationRating.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Payout from "../../models/admin/Payout.js";
import Commission from "../../models/admin/Commission.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";

const TYPE_ALIASES = {
  accommodation: "accommodation",
  hotel: "accommodation",
  lodge: "accommodation",
  camp: "accommodation",
  resort: "accommodation",
  bnb: "accommodation",
  guesthouse: "accommodation",
  villa: "accommodation",
  apartment: "accommodation",
  restaurant: "restaurant",
  food: "restaurant",
  transport: "transport",
  transport_partner: "transport",
};

const normalizeType = (raw) => {
  const key = String(raw || "").toLowerCase();
  const normalized = TYPE_ALIASES[key];
  if (!normalized) throw new ApiError(400, "Invalid partner type");
  return normalized;
};

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const getModel = (type) => {
  const normalized = normalizeType(type);
  if (normalized === "transport") return TransportPartner;
  if (normalized === "accommodation") return AccommodationPartner;
  return RestaurantPartner;
};

const list = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { status, search, page = 1, limit = 20 } = req.query;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Model.countDocuments(filter),
  ]);

  const enriched = items.map((doc) => {
    const obj = doc.toObject();
    obj.type = normalized;
    obj.category = normalized;
    return obj;
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: enriched,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id).lean();
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.type = normalized;
  partner.category = normalized;

  const WalletModel =
    normalized === "transport"
      ? TransportWallet
      : normalized === "accommodation"
      ? AccommodationWallet
      : RestaurantWallet;

  const wallet = await WalletModel.findOne({ partner: id }).lean();

  res.status(200).json(new ApiResponse(200, { partner, wallet }));
});

const approve = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "active";
  partner.approvedBy = req.admin._id;
  partner.approvedAt = new Date();
  partner.rejectionReason = null;
  await partner.save();

  const { branding, settings } = await getContext();
  await emailService.partnerApproved(partner, { branding, settings });

  const obj = partner.toObject();
  obj.type = normalized;
  obj.category = normalized;

  res.status(200).json(new ApiResponse(200, obj, "Partner approved"));
});

const reject = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { reason } = req.body;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "rejected";
  partner.rejectionReason = reason || "Not specified";
  await partner.save();

  const { branding, settings } = await getContext();
  await emailService.partnerRejected(partner, {
    reason: partner.rejectionReason,
    branding,
    settings,
  });

  const obj = partner.toObject();
  obj.type = normalized;
  obj.category = normalized;

  res.status(200).json(new ApiResponse(200, obj, "Partner rejected"));
});

const suspend = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { reason } = req.body;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "suspended";
  await partner.save();

  const { branding, settings } = await getContext();
  await emailService.partnerSuspended(partner, {
    reason: reason || "Policy violation",
    branding,
    settings,
  });

  const obj = partner.toObject();
  obj.type = normalized;
  obj.category = normalized;

  res.status(200).json(new ApiResponse(200, obj, "Partner suspended"));
});

const reactivate = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "active";
  await partner.save();

  const { branding, settings } = await getContext();
  await emailService.partnerReactivated(partner, { branding, settings });

  const obj = partner.toObject();
  obj.type = normalized;
  obj.category = normalized;

  res.status(200).json(new ApiResponse(200, obj, "Partner reactivated"));
});

const hardDelete = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const normalized = normalizeType(type);
  const Model = getModel(type);

  const partner = await Model.findById(id);
  if (!partner) throw new ApiError(404, "Partner not found");

  if (normalized === "restaurant") {
    const orders = await FoodOrder.find({ restaurant: id }).select("_id").lean();
    const orderIds = orders.map((o) => o._id);

    await Promise.all([
      Menu.deleteMany({ restaurant: id }),
      MenuItem.deleteMany({ restaurant: id }),
      FoodOrder.deleteMany({ restaurant: id }),
      DineInBooking.deleteMany({ restaurant: id }),
      BroadcastRequest.deleteMany({ acceptedBy: id }),
      BroadcastRequest.updateMany(
        { targetedRestaurants: id },
        { $pull: { targetedRestaurants: id } }
      ),
      RestaurantRating.deleteMany({ restaurant: id }),
      RestaurantWallet.deleteMany({ restaurant: id }),
      DeliveryJob.deleteMany({ restaurant: id }),
      DeliveryJob.updateMany(
        { order: { $in: orderIds } },
        { $set: { order: null } }
      ),
      Payout.deleteMany({ partner: id, partnerType: "restaurant" }),
      Commission.deleteMany({ partner: id, partnerType: "restaurant" }),
    ]);
  } else if (normalized === "transport") {
    await Promise.all([
      Vehicle.deleteMany({ partner: id }),
      Trip.deleteMany({ partner: id }),
      DeliveryJob.deleteMany({ partner: id }),
      DriverLocation.deleteMany({ partner: id }),
      DriverRating.deleteMany({ partner: id }),
      TransportWallet.deleteMany({ partner: id }),
      Payout.deleteMany({ partner: id, partnerType: "transport" }),
      Commission.deleteMany({ partner: id, partnerType: "transport" }),
    ]);
  } else if (normalized === "accommodation") {
    await Promise.all([
      RoomAvailability.deleteMany({ partner: id }),
      Room.deleteMany({ partner: id }),
      Property.deleteMany({ partner: id }),
      Booking.deleteMany({ partner: id }),
      Guest.deleteMany({ partner: id }),
      AccommodationRating.deleteMany({ partner: id }),
      AccommodationWallet.deleteMany({ partner: id }),
      Payout.deleteMany({ partner: id, partnerType: "accommodation" }),
      Commission.deleteMany({ partner: id, partnerType: "accommodation" }),
    ]);
  }

  await Model.deleteOne({ _id: id });

  res.status(200).json(new ApiResponse(200, null, "Partner permanently deleted"));
});

export { list, details, approve, reject, suspend, reactivate, hardDelete };