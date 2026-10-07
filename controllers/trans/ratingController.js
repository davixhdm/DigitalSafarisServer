import DriverRating from "../../models/trans/DriverRating.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    DriverRating.find({ partner: req.partner._id })
      .populate("customer", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    DriverRating.countDocuments({ partner: req.partner._id }),
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

const summary = asyncHandler(async (req, res) => {
  const [agg] = await DriverRating.aggregate([
    { $match: { partner: req.partner._id } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      average: agg?.average ? Number(agg.average.toFixed(2)) : 0,
      count: agg?.count ?? 0,
    })
  );
});

const refreshPartnerRating = asyncHandler(async (req, res) => {
  const [agg] = await DriverRating.aggregate([
    { $match: { partner: req.partner._id } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (agg) {
    await TransportPartner.updateOne(
      { _id: req.partner._id },
      {
        $set: {
          rating: Number(agg.average.toFixed(2)),
          totalRatings: agg.count,
        },
      }
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        rating: agg?.average ? Number(agg.average.toFixed(2)) : 0,
        totalRatings: agg?.count ?? 0,
      },
      "Rating summary refreshed"
    )
  );
});

export { list, summary, refreshPartnerRating };