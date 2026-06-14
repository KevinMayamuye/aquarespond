import Rating from "../models/Rating.js";

export const getPlumberRatingSummaries = async (
  plumberIds
) => {
  if (!plumberIds?.length) {
    return new Map();
  }

  const summaries = await Rating.aggregate([
    {
      $match: {
        plumber: {
          $in: plumberIds,
        },
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$plumber",
        averageRating: { $avg: "$score" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();

  for (const item of summaries) {
    map.set(item._id.toString(), {
      averageRating: Math.round(
        item.averageRating * 10
      ) / 10,
      ratingCount: item.ratingCount,
    });
  }

  return map;
};

export const getPlumberReviews = async (
  plumberId,
  limit = 10
) => {
  const reviews = await Rating.find({
    plumber: plumberId,
    status: "approved",
  })
    .select("score comment createdAt")
    .sort({ createdAt: -1 })
    .limit(limit);

  return reviews.map((review) => ({
    score: review.score,
    comment: review.comment,
    createdAt: review.createdAt,
  }));
};

export const attachRatingSummary = (
  plumber,
  summaryMap
) => {
  const summary = summaryMap.get(
    plumber._id.toString()
  );

  return {
    ...plumber.toObject?.() ?? plumber,
    averageRating: summary?.averageRating ?? null,
    ratingCount: summary?.ratingCount ?? 0,
  };
};
