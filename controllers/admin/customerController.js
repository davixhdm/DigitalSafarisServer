import Customer from "../../models/customer/Customer.js";
import CustomerProfile from "../../models/customer/CustomerProfile.js";
import CustomerAddress from "../../models/customer/CustomerAddress.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import CustomerReview from "../../models/customer/CustomerReview.js";
import CustomerNotification from "../../models/customer/CustomerNotification.js";
import CustomerSession from "../../models/customer/CustomerSession.js";
import CustomerOTP from "../../models/customer/CustomerOTP.js";
import CustomerPreference from "../../models/customer/CustomerPreference.js";
import Booking from "../../models/accom/Booking.js";
import Guest from "../../models/accom/Guest.js";
import AccommodationRating from "../../models/accom/AccommodationRating.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import DineInBooking from "../../models/rest/DineInBooking.js";
import RestaurantRating from "../../models/rest/RestaurantRating.js";
import BroadcastRequest from "../../models/rest/BroadcastRequest.js";
import Trip from "../../models/trans/Trip.js";
import DeliveryJob from "../../models/trans/DeliveryJob.js";
import DriverRating from "../../models/trans/DriverRating.js";
import Dispute from "../../models/admin/Dispute.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false };

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const customer = await Customer.findById(id).lean();
  if (!customer) throw new ApiError(404, "Customer not found");

  const wallet = await CustomerWallet.findOne({ customer: id }).lean();

  const [bookings, orders, trips, spentAgg] = await Promise.all([
    Booking.countDocuments({ customer: id }),
    FoodOrder.countDocuments({ customer: id }),
    Trip.countDocuments({ customer: id }),
    CustomerPayment.aggregate([
      {
        $match: {
          customer: customer._id,
          status: "success",
          purpose: { $in: ["booking", "food_order", "transport"] },
        },
      },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
  ]);

  const safe = { ...customer };
  delete safe.password;
  delete safe.refreshToken;

  res.status(200).json(
    new ApiResponse(200, {
      customer: {
        ...safe,
        walletBalance: wallet?.balance ?? 0,
        totalBookings: bookings,
        totalOrders: orders,
        totalTrips: trips,
        totalSpent: spentAgg[0]?.sum ?? 0,
      },
      wallet,
    })
  );
});

const suspend = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");

  customer.status = "suspended";
  await customer.save();

  res.status(200).json(new ApiResponse(200, customer, "Customer suspended"));
});

const reactivate = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, "Customer not found");

  customer.status = "active";
  await customer.save();

  res.status(200).json(new ApiResponse(200, customer, "Customer reactivated"));
});

const hardDelete = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, "Customer not found");

  await Promise.all([
    CustomerProfile.deleteMany({ customer: id }),
    CustomerAddress.deleteMany({ customer: id }),
    CustomerWallet.deleteMany({ customer: id }),
    CustomerPayment.deleteMany({ customer: id }),
    CustomerReview.deleteMany({ customer: id }),
    CustomerNotification.deleteMany({ customer: id }),
    CustomerSession.deleteMany({ customer: id }),
    CustomerOTP.deleteMany({ customer: id }),
    CustomerPreference.deleteMany({ customer: id }),
    Booking.deleteMany({ customer: id }),
    Guest.deleteMany({ customer: id }),
    AccommodationRating.deleteMany({ customer: id }),
    FoodOrder.deleteMany({ customer: id }),
    DineInBooking.deleteMany({ customer: id }),
    RestaurantRating.deleteMany({ customer: id }),
    BroadcastRequest.deleteMany({ customer: id }),
    Trip.deleteMany({ customer: id }),
    DeliveryJob.deleteMany({ customer: id }),
    DriverRating.deleteMany({ customer: id }),
    Dispute.deleteMany({ raisedById: id }),
    Customer.updateMany({ referredBy: id }, { $set: { referredBy: null } }),
  ]);

  await Customer.deleteOne({ _id: id });

  res.status(200).json(new ApiResponse(200, null, "Customer permanently deleted"));
});

export { list, details, suspend, reactivate, hardDelete };