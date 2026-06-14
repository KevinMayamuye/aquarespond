import User from "../models/User.js";

import { getIO } from "../socket/socketManager.js";

export const notifyAdmins = async (event, payload) => {
  const admins = await User.find({
    role: "admin",
  }).select("_id");

  const io = getIO();

  for (const admin of admins) {
    io.to(admin._id.toString()).emit(
      event,
      payload
    );
  }
};
