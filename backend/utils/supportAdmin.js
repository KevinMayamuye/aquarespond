import User from "../models/User.js";

export const getSupportAdmin = async () => {
  const supportEmail =
    process.env.SUPPORT_ADMIN_EMAIL?.trim();

  if (supportEmail) {
    const byEmail = await User.findOne({
      email: supportEmail,
      role: "admin",
    }).select("_id username email role");

    if (byEmail) {
      return byEmail;
    }
  }

  return User.findOne({ role: "admin" })
    .sort({ createdAt: 1 })
    .select("_id username email role");
};
