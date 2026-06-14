import User from "../models/User.js";
import { serverError } from "../utils/serverError.js";

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

    res.status(200).json(plumbers);
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

    res.status(200).json(plumber);
  } catch (error) {
    return serverError(res, error);
  }
};
