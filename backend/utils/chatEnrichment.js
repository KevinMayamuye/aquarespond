export const isSupportChatParticipants = (
  participants,
  supportAdminId
) => {
  if (!supportAdminId || !participants?.length) {
    return false;
  }

  const supportId = supportAdminId.toString();

  return participants.some(
    (participant) =>
      (participant._id ?? participant)
        .toString() === supportId
  );
};

export const enrichChat = (
  chat,
  {
    bookingByChatId = {},
    supportAdminId = null,
    userRole = null,
  } = {}
) => {
  const chatId = chat._id.toString();
  const participants = chat.participants ?? [];
  const isSupportChat = isSupportChatParticipants(
    participants,
    supportAdminId
  );
  const activeBooking =
    bookingByChatId[chatId] ?? null;

  const messagingAllowed =
    userRole === "admin" ||
    isSupportChat ||
    Boolean(activeBooking);

  return {
    ...chat,
    activeBooking,
    messagingAllowed,
    isSupportChat,
  };
};

export const sortChatsWithSupportFirst = (
  chats
) => {
  return [...chats].sort((a, b) => {
    if (a.isSupportChat && !b.isSupportChat) {
      return -1;
    }

    if (!a.isSupportChat && b.isSupportChat) {
      return 1;
    }

    return (
      new Date(b.updatedAt) -
      new Date(a.updatedAt)
    );
  });
};
