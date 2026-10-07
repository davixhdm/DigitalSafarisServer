import CustomerReview from "../../models/customer/CustomerReview.js";
import RestaurantRating from "../../models/rest/RestaurantRating.js";
import DriverRating from "../../models/trans/DriverRating.js";
import AccommodationRating from "../../models/accom/AccommodationRating.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const recalcAverage = async (model, id, field = "restaurant") => {
  const ratings = await model.find({ [field]: id });
  if (ratings.length === 0) return;
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  return { avg: Number(avg.toFixed(2)), total: ratings.length };
};

const create = asyncHandler(async (req, res) => {
  const {
    targetType, targetId, order, booking, trip,
    rating, title, comment, images, tags,
    foodQuality, service, delivery, value,
    cleanliness, comfort, location,
  } = req.body;

  if (!["restaurant", "transport", "accommodation"].includes(targetType)) {
    throw new ApiError(400, "Invalid target type");
  }

  const review = await CustomerReview.create({
    customer: req.customer._id,
    targetType,
    targetId,
    order: order || null,
    booking: booking || null,
    trip: trip || null,
    rating,
    title: title || null,
    comment: comment || "",
    images: images || [],
    status: "published",
  });

  const { branding, settings } = await getContext();

  if (targetType === "restaurant") {
    await RestaurantRating.create({
      restaurant: targetId,
      customer: req.customer._id,
      order: order || null,
      booking: booking || null,
      rating,
      foodQuality: foodQuality || null,
      service: service || null,
      delivery: delivery || null,
      value: value || null,
      comment,
      images: images || [],
      tags: tags || [],
    });

    const stats = await recalcAverage(RestaurantRating, targetId, "restaurant");
    if (stats) {
      const partner = await RestaurantPartner.findByIdAndUpdate(targetId, {
        $set: { rating: stats.avg, totalRatings: stats.total },
      }, { new: true });

      await emailService.reviewReceived(partner, {
        review: { rating, comment },
        branding,
        settings,
      });
    }
  } else if (targetType === "transport") {
    await DriverRating.create({
      partner: targetId,
      customer: req.customer._id,
      trip: trip || null,
      rating,
      comment,
      tags: tags || [],
    });

    const stats = await recalcAverage(DriverRating, targetId, "partner");
    if (stats) {
      const partner = await TransportPartner.findByIdAndUpdate(targetId, {
        $set: { rating: stats.avg, totalRatings: stats.total },
      }, { new: true });

      await emailService.reviewReceived(partner, {
        review: { rating, comment },
        branding,
        settings,
      });
    }
  } else if (targetType === "accommodation") {
    await AccommodationRating.create({
      partner: targetId,
      property: req.body.property,
      room: req.body.room || null,
      customer: req.customer._id,
      booking: booking || null,
      rating,
      cleanliness: cleanliness || null,
      comfort: comfort || null,
      location: location || null,
      service: service || null,
      value: value || null,
      comment,
      images: images || [],
      tags: tags || [],
    });

    const stats = await recalcAverage(AccommodationRating, targetId, "partner");
    if (stats) {
      const partner = await AccommodationPartner.findByIdAndUpdate(targetId, {
        $set: { rating: stats.avg, totalRatings: stats.total },
      }, { new: true });

      await emailService.reviewReceived(partner, {
        review: { rating, comment },
        branding,
        settings,
      });
    }
  }

  res.status(201).json(new ApiResponse(201, review, "Review submitted"));
});

const list = asyncHandler(async (req, res) => {
  const { targetType, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (targetType) filter.targetType = targetType;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    CustomerReview.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const listForTarget = asyncHandler(async (req, res) => {
  const { targetType, targetId, page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerReview.find({ targetType, targetId, status: "published" })
      .populate("customer", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerReview.countDocuments({ targetType, targetId, status: "published" }),
  ]);

  res.status(200).json(new ApiResponse(200, { items, total, page: Number(page), limit: Number(limit) }));
});

const update = asyncHandler(async (req, res) => {
  const review = await CustomerReview.findOne({ _id: req.params.id, customer: req.customer._id });
  if (!review) throw new ApiError(404, "Review not found");

  const { rating, title, comment, images } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  res.status(200).json(new ApiResponse(200, review, "Review updated"));
});

const remove = asyncHandler(async (req, res) => {
  const review = await CustomerReview.findOneAndDelete({ _id: req.params.id, customer: req.customer._id });
  if (!review) throw new ApiError(404, "Review not found");
  res.status(200).json(new ApiResponse(200, null, "Review deleted"));
});

export { create, list, listForTarget, update, remove };