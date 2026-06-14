import User from "../models/User.js";

import { getIO } from "./socketManager.js";

export const broadcastUserStatus = (
  userId,
  isOnline,
  lastSeen = null
) => {
  getIO().emit("userStatusChange", {
    userId: userId.toString(),
    isOnline,
    lastSeen,
  });
};

export const setUserOnline = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    isOnline: true,
  });

  broadcastUserStatus(userId, true, null);
};

export const setUserOffline = async (userId) => {
  const lastSeen = new Date();

  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen,
  });

  broadcastUserStatus(
    userId,
    false,
    lastSeen.toISOString()
  );
};