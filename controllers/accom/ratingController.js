import AccommodationRating from "../../models/accom/AccommodationRating.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AccommodationRating.find({ partner: req.partner._id })
      .populate("customer", "firstName lastName avatar")
      .populate("property", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AccommodationRating.countDocuments({ partner: req.partner._id }),
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
  const [agg] = await AccommodationRating.aggregate([
    { $match: { partner: req.partner._id } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
        cleanliness: { $avg: "$cleanliness" },
        comfort: { $avg: "$comfort" },
        location: { $avg: "$location" },
        service: { $avg: "$service" },
        value: { $avg: "$value" },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      average: agg?.average ? Number(agg.average.toFixed(2)) : 0,
      count: agg?.count ?? 0,
      cleanliness: agg?.cleanliness ? Number(agg.cleanliness.toFixed(2)) : null,
      comfort: agg?.comfort ? Number(agg.comfort.toFixed(2)) : null,
      location: agg?.location ? Number(agg.location.toFixed(2)) : null,
      service: agg?.service ? Number(agg.service.toFixed(2)) : null,
      value: agg?.value ? Number(agg.value.toFixed(2)) : null,
    })
  );
});

const reply = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const rating = await AccommodationRating.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    {
      $set: {
        reply: {
          message,
          repliedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!rating) {
    res.status(404).json(new ApiResponse(404, null, "Rating not found"));
    return;
  }

  res.status(200).json(new ApiResponse(200, rating, "Reply posted"));
});

const refreshPartnerRating = asyncHandler(async (req, res) => {
  const [agg] = await AccommodationRating.aggregate([
    { $match: { partner: req.partner._id } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (agg) {
    await AccommodationPartner.updateOne(
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

export { list, summary, reply, refreshPartnerRating };