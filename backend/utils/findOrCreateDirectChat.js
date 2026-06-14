import Chat from "../models/Chat.js";
import { getIO } from "../socket/socketManager.js";
import { getUnreadCountsForChats } from "../utils/unreadCount.js";

const participantFields =
  "username email isOnline lastSeen profilePicture role";

const populateChat = (query) =>
  query
    .populate("participants", participantFields)
    .populate({
      path: "lastMessage",
      select:
        "content messageType attachment editedAt replyTo reactions createdAt sender readBy deliveredTo",
      populate: {
        path: "sender",
        select: "username",
      },
    });

const attachUnreadCounts = async (
  chats,
  userId
) => {
  const unreadMap =
    await getUnreadCountsForChats(
      chats.map((chat) => chat._id),
      userId
    );

  return chats.map((chat) => {
    const chatObject =
      chat.toObject?.() ?? chat;

    return {
      ...chatObject,
      unreadCount:
        unreadMap[chat._id.toString()] || 0,
    };
  });
};

const notifyParticipantsChatAdded = async (
  populatedChat,
  userA,
  userB
) => {
  const io = getIO();
  const participantIds = [
    userA.toString(),
    userB.toString(),
  ];

  for (const participantId of participantIds) {
    const [chatWithUnread] =
      await attachUnreadCounts(
        [populatedChat],
        participantId
      );

    io.to(participantId).emit(
      "chatAdded",
      chatWithUnread
    );
  }
};

export const findOrCreateDirectChat = async (
  userA,
  userB,
  options = {}
) => {
  const { bookingId = null, notifyUserId = null } =
    options;

  let chat = await Chat.findOne({
    isGroup: { $ne: true },
    participants: {
      $all: [userA, userB],
      $size: 2,
    },
  });

  let isNew = false;

  if (!chat) {
    chat = await Chat.create({
      participants: [userA, userB],
      ...(bookingId && { booking: bookingId }),
    });
    isNew = true;
  } else if (bookingId) {
    chat.booking = bookingId;
    await chat.save();
  }

  const populatedChat = await populateChat(
    Chat.findById(chat._id)
  );

  if (isNew) {
    await notifyParticipantsChatAdded(
      populatedChat,
      userA,
      userB
    );
  } else if (bookingId) {
    await notifyParticipantsChatAdded(
      populatedChat,
      userA,
      userB
    );
  } else if (notifyUserId) {
    const [chatWithUnread] =
      await attachUnreadCounts(
        [populatedChat],
        notifyUserId
      );

    getIO()
      .to(notifyUserId.toString())
      .emit("chatAdded", chatWithUnread);
  }

  return { chat: populatedChat, isNew };
};

export { populateChat, attachUnreadCounts };
