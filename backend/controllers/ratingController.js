import Booking from "../models/Booking.js";
import Rating from "../models/Rating.js";

import { notifyAdmins } from "../utils/notifyAdmins.js";
import {
  getPlumberReviews,
} from "../utils/plumberRatings.js";
import { serverError } from "../utils/serverError.js";

const RATING_STATUSES = [
  "pending",
  "approved",
  "rejected",
];

const userFields = "username profilePicture";

const populateRating = (query) =>
  query
    .populate("customer", userFields)
    .populate("plumber", userFields)
    .populate("booking", "serviceType scheduledAt status");

const validateScore = (score) => {
  const parsed = Number(score);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 5
  ) {
    return null;
  }

  return parsed;
};

export const submitBookingRating = async (
  req,
  res
) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.customer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        message:
          "Only completed bookings can be rated",
      });
    }

    const existing = await Rating.findOne({
      booking: booking._id,
    });

    if (existing) {
      return res.status(409).json({
        message: "This booking has already been rated",
      });
    }

    const score = validateScore(req.body.score);

    if (!score) {
      return res.status(400).json({
        message: "Score must be an integer from 1 to 5",
      });
    }

    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim().slice(0, 500)
        : "";

    const rating = await Rating.create({
      booking: booking._id,
      customer: req.user._id,
      plumber: booking.plumber,
      score,
      comment,
    });

    const populated = await populateRating(
      Rating.findById(rating._id)
    );

    await notifyAdmins(
      "ratingSubmitted",
      populated
    );

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This booking has already been rated",
      });
    }

    return serverError(res, error);
  }
};

export const getBookingRating = async (
  req,
  res
) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      booking.customer.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const rating = await Rating.findOne({
      booking: booking._id,
      customer: req.user._id,
    }).select("score comment status createdAt");

    res.status(200).json(rating);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMyPlumberRatings = async (
  req,
  res
) => {
  try {
    const ratings = await Rating.find({
      plumber: req.user._id,
      status: "approved",
    })
      .select("score comment createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(ratings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getAdminRatings = async (
  req,
  res
) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!RATING_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid status filter",
        });
      }

      filter.status = status;
    }

    const ratings = await populateRating(
      Rating.find(filter).sort({
        createdAt: -1,
      })
    );

    res.status(200).json(ratings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateAdminRating = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (
      status !== "approved" &&
      status !== "rejected"
    ) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const rating = await Rating.findById(
      req.params.id
    );

    if (!rating) {
      return res.status(404).json({
        message: "Rating not found",
      });
    }

    if (rating.status !== "pending") {
      return res.status(400).json({
        message: "Only pending ratings can be updated",
      });
    }

    rating.status = status;
    await rating.save();

    const populated = await populateRating(
      Rating.findById(rating._id)
    );

    await notifyAdmins(
      "ratingUpdated",
      populated
    );

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getPlumberRatingDetails = async (
  req,
  res
) => {
  try {
    const reviews = await getPlumberReviews(
      req.user._id
    );

    const summary = await Rating.aggregate([
      {
        $match: {
          plumber: req.user._id,
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$score" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const stats = summary[0];

    res.status(200).json({
      averageRating: stats
        ? Math.round(stats.averageRating * 10) / 10
        : null,
      ratingCount: stats?.ratingCount ?? 0,
      reviews,
    });
  } catch (error) {
    return serverError(res, error);
  }
};
