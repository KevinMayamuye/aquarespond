import User from "../models/User.js";

import { escapeRegex } from "../utils/escapeRegex.js";
import { serverError } from "../utils/serverError.js";

const MAX_PROFILE_PICTURE_LENGTH = 2_800_000;

const publicProfileFields =
  "username profilePicture isOnline lastSeen createdAt";

const formatPublicProfile = (user) => ({
  _id: user._id,
  username: user.username,
  profilePicture: user.profilePicture ?? null,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
});

export const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username?.trim()) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    const users = await User.find({
      username: {
        $regex: escapeRegex(username.trim()),
        $options: "i",
      },
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMyProfile = async (req, res) => {
  try {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      profilePicture: req.user.profilePicture ?? null,
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      publicProfileFields
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(formatPublicProfile(user));
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (profilePicture === undefined) {
      return res.status(400).json({
        message: "No fields to update",
      });
    }

    if (
      profilePicture !== null &&
      typeof profilePicture !== "string"
    ) {
      return res.status(400).json({
        message: "profilePicture must be a string or null",
      });
    }

    if (
      profilePicture !== null &&
      profilePicture.length > MAX_PROFILE_PICTURE_LENGTH
    ) {
      return res.status(400).json({
        message: "Profile picture is too large",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    ).select("-password");

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture ?? null,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return serverError(res, error);
  }
};