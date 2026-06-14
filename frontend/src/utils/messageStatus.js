export const hasReadByUser = (readBy, userId) =>
  readBy?.some(
    (id) =>
      (id?._id ?? id)?.toString() ===
      userId?.toString()
  );

export const hasDeliveredToUser = (
  deliveredTo,
  userId
) =>
  deliveredTo?.some(
    (id) =>
      (id?._id ?? id)?.toString() ===
      userId?.toString()
  );

export const getMessageStatus = (
  message,
  otherUserId
) => {
  if (
    hasReadByUser(message.readBy, otherUserId)
  ) {
    return "read";
  }

  if (
    hasDeliveredToUser(
      message.deliveredTo,
      otherUserId
    )
  ) {
    return "delivered";
  }

  return "sent";
};

export const formatLastSeen = (
  isOnline,
  lastSeen
) => {
  if (isOnline) {
    return "online";
  }

  if (!lastSeen) {
    return "offline";
  }

  const date = new Date(lastSeen);
  const now = new Date();
  const isToday =
    date.toDateString() ===
    now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.toDateString() ===
    yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `last seen today at ${time}`;
  }

  if (isYesterday) {
    return `last seen yesterday at ${time}`;
  }

  return `last seen ${date.toLocaleDateString()} at ${time}`;
};

export const updateParticipantStatus = (
  participants,
  userId,
  isOnline,
  lastSeen
) =>
  participants.map((participant) =>
    participant._id?.toString() ===
    userId?.toString()
      ? {
          ...participant,
          isOnline,
          lastSeen,
        }
      : participant
  );
