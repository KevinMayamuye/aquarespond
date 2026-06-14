import Booking from "../models/Booking.js";
import Chat from "../models/Chat.js";

import { getSupportAdmin } from "../utils/supportAdmin.js";

export const getActiveBookingForChat = async (chatId) =>
  Booking.findOne({ chat: chatId, status: "accepted" });

export const isSupportChatForUser = async (
  chatId,
  user
) => {
  const supportAdmin = await getSupportAdmin();

  if (!supportAdmin) {
    return false;
  }

  const chat = await Chat.findById(chatId).select(
    "participants"
  );

  if (!chat) {
    return false;
  }

  const supportId = supportAdmin._id.toString();
  const userId = user._id.toString();

  const hasSupport = chat.participants.some(
    (id) => id.toString() === supportId
  );
  const hasUser = chat.participants.some(
    (id) => id.toString() === userId
  );

  return hasSupport && hasUser;
};

export const isChatMessagingAllowed = async (
  chatId,
  user
) => {
  if (user?.role === "admin") {
    return isSupportChatForUser(chatId, user);
  }

  if (await isSupportChatForUser(chatId, user)) {
    return true;
  }

  const booking =
    await getActiveBookingForChat(chatId);

  return Boolean(booking);
};

export const assertChatMessagingAllowed = async (
  chatId,
  user
) => {
  if (user?.role === "admin") {
    const allowed = await isSupportChatForUser(
      chatId,
      user
    );

    if (allowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: "Forbidden",
    };
  }

  if (await isSupportChatForUser(chatId, user)) {
    return { allowed: true };
  }

  const activeBooking =
    await getActiveBookingForChat(chatId);

  if (activeBooking) {
    return { allowed: true };
  }

  const anyBooking = await Booking.findOne({
    chat: chatId,
  });

  if (anyBooking) {
    return {
      allowed: false,
      message:
        "This job is complete. Rebook to continue chatting.",
    };
  }

  return {
    allowed: false,
    message:
      "Chat is available after the plumber accepts your booking",
  };
};

export const hasPlumberSlotConflict = async (
  plumberId,
  scheduledAt,
  excludeBookingId = null
) => {
  const slot = new Date(scheduledAt);

  const filter = {
    plumber: plumberId,
    scheduledAt: slot,
    status: { $in: ["pending", "accepted"] },
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const existing = await Booking.findOne(filter);

  return Boolean(existing);
};
