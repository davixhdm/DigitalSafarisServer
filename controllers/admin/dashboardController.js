import Customer from "../../models/customer/Customer.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Booking from "../../models/accom/Booking.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Trip from "../../models/trans/Trip.js";
import Payout from "../../models/admin/Payout.js";
import Dispute from "../../models/admin/Dispute.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const overview = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    totalRestaurants,
    totalTransport,
    totalAccommodations,
    bookingsToday,
    ordersToday,
    tripsToday,
    payoutsToday,
    openDisputes,
  ] = await Promise.all([
    Customer.countDocuments({ isDeleted: false }),
    RestaurantPartner.countDocuments({ isDeleted: false }),
    TransportPartner.countDocuments({ isDeleted: false }),
    AccommodationPartner.countDocuments({ isDeleted: false }),
    Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
    FoodOrder.countDocuments({ createdAt: { $gte: startOfDay } }),
    Trip.countDocuments({ createdAt: { $gte: startOfDay } }),
    Payout.countDocuments({ createdAt: { $gte: startOfDay } }),
    Dispute.countDocuments({ status: { $in: ["open", "investigating"] } }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalCustomers,
      totalRestaurants,
      totalTransport,
      totalAccommodations,
      bookingsToday,
      ordersToday,
      tripsToday,
      payoutsToday,
      openDisputes,
    })
  );
});

export { overview };