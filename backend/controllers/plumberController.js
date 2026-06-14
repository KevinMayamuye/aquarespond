import User from "../models/User.js";
import { serverError } from "../utils/serverError.js";
import {
  attachRatingSummary,
  getPlumberRatingSummaries,
  getPlumberReviews,
} from "../utils/plumberRatings.js";

const publicPlumberFields =
  "username profilePicture serviceArea isAvailable isOnline lastSeen phone";

export const listPlumbers = async (req, res) => {
  try {
    const plumbers = await User.find({
      role: "plumber",
      isAvailable: true,
    })
      .select(publicPlumberFields)
      .sort({ username: 1 });

    const summaryMap =
      await getPlumberRatingSummaries(
        plumbers.map((plumber) => plumber._id)
      );

    const withRatings = plumbers.map((plumber) =>
      attachRatingSummary(plumber, summaryMap)
    );

    res.status(200).json(withRatings);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getPlumberById = async (req, res) => {
  try {
    const plumber = await User.findOne({
      _id: req.params.id,
      role: "plumber",
    }).select(publicPlumberFields);

    if (!plumber) {
      return res.status(404).json({
        message: "Plumber not found",
      });
    }

    const summaryMap =
      await getPlumberRatingSummaries([
        plumber._id,
      ]);
    const withSummary = attachRatingSummary(
      plumber,
      summaryMap
    );
    const reviews = await getPlumberReviews(
      plumber._id
    );

    res.status(200).json({
      ...withSummary,
      reviews,
    });
  } catch (error) {
    return serverError(res, error);
  }
};
