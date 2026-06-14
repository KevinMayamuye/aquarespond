import {
  hasDeliveredToUser,
  hasReadByUser,
} from "./messageStatus";

export const isGroupChat = (chat) =>
  chat?.isGroup === true;

export const getOtherParticipant = (
  chat,
  userId
) =>
  chat?.participants?.find(
    (participant) =>
      participant._id?.toString() !==
      userId?.toString()
  );

export const getChatTitle = (chat, userId) => {
  if (isGroupChat(chat)) {
    return chat.name || "Group";
  }

  return (
    getOtherParticipant(chat, userId)?.username ??
    "Unknown"
  );
};

export const getGroupAvatarUser = (chat) => ({
  username: chat?.name || "Group",
});

export const getContactsFromChats = (
  chats,
  userId
) => {
  const contactMap = new Map();

  chats.forEach((chat) => {
    if (isGroupChat(chat)) {
      return;
    }

    const other = getOtherParticipant(
      chat,
      userId
    );

    if (other?._id) {
      contactMap.set(
        other._id.toString(),
        other
      );
    }
  });

  return [...contactMap.values()].sort(
    (a, b) =>
      (a.username || "").localeCompare(
        b.username || ""
      )
  );
};

export const getOtherParticipantIds = (
  chat,
  userId
) =>
  (chat?.participants || [])
    .map((p) => p._id ?? p)
    .filter(
      (id) =>
        id?.toString() !== userId?.toString()
    );

export const getGroupMessageStatus = (
  message,
  chat,
  userId
) => {
  const others = getOtherParticipantIds(
    chat,
    userId
  );

  if (others.length === 0) {
    return "sent";
  }

  const allRead = others.every((id) =>
    hasReadByUser(message.readBy, id)
  );

  if (allRead) {
    return "read";
  }

  const anyDelivered = others.some((id) =>
    hasDeliveredToUser(
      message.deliveredTo,
      id
    )
  );

  if (anyDelivered) {
    return "delivered";
  }

  return "sent";
};

export const getSidebarPreviewSender = (
  lastMessage,
  chat,
  userId
) => {
  if (!lastMessage || !isGroupChat(chat)) {
    return null;
  }

  const senderId =
    lastMessage.sender?._id ??
    lastMessage.sender;

  if (
    senderId?.toString() === userId?.toString()
  ) {
    return null;
  }

  return (
    lastMessage.sender?.username ?? "Unknown"
  );
};

export const getParticipantById = (
  chat,
  participantId
) =>
  chat?.participants?.find(
    (p) =>
      p._id?.toString() ===
      participantId?.toString()
  );
