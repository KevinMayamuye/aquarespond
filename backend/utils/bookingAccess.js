import Booking from "../models/Booking.js";

export const getActiveBookingForChat = async (chatId) =>
  Booking.findOne({ chat: chatId, status: "accepted" });

export const isChatMessagingAllowed = async (
  chatId
) => {
  const booking =
    await getActiveBookingForChat(chatId);

  return Boolean(booking);
};

export const assertChatMessagingAllowed = async (
  chatId
) => {
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
