import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

import { serverError } from "../utils/serverError.js";
import { notifyChatParticipants } from "../socket/chatNotify.js";
import {
  findOrCreateDirectChat,
  attachUnreadCounts,
} from "../utils/findOrCreateDirectChat.js";
import { ensureSupportChat } from "../utils/ensureSupportChat.js";
import { getSupportAdmin } from "../utils/supportAdmin.js";
import {
  enrichChat,
  sortChatsWithSupportFirst,
} from "../utils/chatEnrichment.js";

const participantFields =
  "username email isOnline lastSeen profilePicture role";

const BOOKING_ONLY_ROLES = ["customer", "plumber"];

const populateChat = (query) =>
  query
    .populate(
      "participants",
      participantFields
    )
    .populate({
      path: "lastMessage",
      select:
        "content messageType attachment editedAt replyTo reactions createdAt sender readBy deliveredTo",
      populate: {
        path: "sender",
        select: "username",
      },
    });

const attachUnreadCountsLocal = attachUnreadCounts;

const chatToObject = (chat) =>
  chat.toObject?.() ?? chat;

const getBookingChatsForUser = async (userId) => {
  const activeBookings = await Booking.find({
    status: "accepted",
    $or: [
      { customer: userId },
      { plumber: userId },
    ],
    chat: { $ne: null },
  }).select(
    "_id status scheduledAt serviceType chat"
  );

  const chatIds = [
    ...new Set(
      activeBookings.map((booking) =>
        booking.chat.toString()
      )
    ),
  ];

  const bookingByChatId = {};

  for (const booking of activeBookings) {
    bookingByChatId[booking.chat.toString()] = {
      _id: booking._id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      serviceType: booking.serviceType,
    };
  }

  if (chatIds.length === 0) {
    return { chats: [], bookingByChatId };
  }

  const chats = await populateChat(
    Chat.find({
      _id: { $in: chatIds },
      participants: userId,
    })
  ).sort({ updatedAt: -1 });

  return { chats, bookingByChatId };
};

export const getChats = async (req, res) => {
  try {
    const supportAdmin = await getSupportAdmin();
    const supportAdminId = supportAdmin?._id ?? null;

    if (req.user.role === "admin") {
      const chats = await populateChat(
        Chat.find({
          participants: req.user._id,
          isGroup: { $ne: true },
        })
      ).sort({ updatedAt: -1 });

      const chatsWithUnread =
        await attachUnreadCountsLocal(
          chats,
          req.user._id
        );

      const enriched = chatsWithUnread.map(
        (chat) =>
          enrichChat(chatToObject(chat), {
            supportAdminId,
            userRole: "admin",
          })
      );

      return res.status(200).json(enriched);
    }

    const { chats: bookingChats, bookingByChatId } =
      await getBookingChatsForUser(req.user._id);

    let supportChat = null;

    if (
      BOOKING_ONLY_ROLES.includes(req.user.role) &&
      supportAdminId
    ) {
      try {
        supportChat = await ensureSupportChat(
          req.user._id
        );
      } catch (error) {
        console.error(
          "Support chat ensure failed:",
          error
        );
      }
    }

    const chatMap = new Map();

    for (const chat of bookingChats) {
      chatMap.set(chat._id.toString(), chat);
    }

    if (supportChat) {
      chatMap.set(
        supportChat._id.toString(),
        supportChat
      );
    }

    const mergedChats = [...chatMap.values()];

    const chatsWithUnread =
      await attachUnreadCountsLocal(
        mergedChats,
        req.user._id
      );

    const enriched = chatsWithUnread.map((chat) =>
      enrichChat(chatToObject(chat), {
        bookingByChatId,
        supportAdminId,
        userRole: req.user.role,
      })
    );

    res.status(200).json(
      sortChatsWithSupportFirst(enriched)
    );
  } catch (error) {
    return serverError(res, error);
  }
};

export const getOrCreateSupportChat = async (
  req,
  res
) => {
  try {
    if (
      !BOOKING_ONLY_ROLES.includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const supportAdmin = await getSupportAdmin();

    if (!supportAdmin) {
      return res.status(503).json({
        message: "Support is not available",
      });
    }

    const populatedChat = await ensureSupportChat(
      req.user._id
    );

    const [chatWithUnread] =
      await attachUnreadCountsLocal(
        [populatedChat],
        req.user._id
      );

    const enriched = enrichChat(
      chatToObject(chatWithUnread),
      {
        supportAdminId: supportAdmin._id,
        userRole: req.user.role,
      }
    );

    res.status(200).json(enriched);
  } catch (error) {
    return serverError(res, error);
  }
};

export const createOrGetChat = async (
  req,
  res
) => {
  try {
    if (
      BOOKING_ONLY_ROLES.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "Chats are created when a booking is accepted",
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const currentUser = req.user._id;

    if (
      userId.toString() ===
      currentUser.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot start a chat with yourself",
      });
    }

    const otherUser =
      await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { chat: populatedChat } =
      await findOrCreateDirectChat(
        currentUser,
        userId
      );

    const [chatWithUnread] =
      await attachUnreadCountsLocal(
        [populatedChat],
        req.user._id
      );

    const supportAdmin = await getSupportAdmin();

    const enriched = enrichChat(
      chatToObject(chatWithUnread),
      {
        supportAdminId: supportAdmin?._id,
        userRole: req.user.role,
      }
    );

    res.status(200).json(enriched);
  } catch (error) {
    return serverError(res, error);
  }
};

const MAX_GROUP_NAME_LENGTH = 100;
const MAX_GROUP_MEMBERS = 50;
const MIN_GROUP_OTHER_MEMBERS = 2;

export const createGroupChat = async (
  req,
  res
) => {
  try {
    if (
      BOOKING_ONLY_ROLES.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "Chats are created when a booking is accepted",
      });
    }

    const { name, memberIds } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
      return res.status(400).json({
        message: "Group name is too long",
      });
    }

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({
        message: "memberIds must be an array",
      });
    }

    const currentUserId = req.user._id.toString();

    const uniqueMemberIds = [
      ...new Set(
        memberIds.map((id) => id.toString())
      ),
    ].filter((id) => id !== currentUserId);

    if (uniqueMemberIds.length < MIN_GROUP_OTHER_MEMBERS) {
      return res.status(400).json({
        message:
          "Select at least 2 other members for a group",
      });
    }

    if (uniqueMemberIds.length > MAX_GROUP_MEMBERS - 1) {
      return res.status(400).json({
        message: `Groups can have at most ${MAX_GROUP_MEMBERS} members`,
      });
    }

    const users = await User.find({
      _id: { $in: uniqueMemberIds },
    }).select("_id");

    if (users.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        message: "One or more members were not found",
      });
    }

    const participants = [
      req.user._id,
      ...uniqueMemberIds,
    ];

    const chat = await Chat.create({
      participants,
      isGroup: true,
      name: trimmedName,
      createdBy: req.user._id,
    });

    const populatedChat = await populateChat(
      Chat.findById(chat._id)
    );

    const [chatWithUnread] =
      await attachUnreadCountsLocal(
        [populatedChat],
        req.user._id
      );

    notifyChatParticipants(
      chat,
      req.user._id,
      "chatAdded",
      chatWithUnread
    );

    res.status(201).json(chatWithUnread);
  } catch (error) {
    return serverError(res, error);
  }
};
