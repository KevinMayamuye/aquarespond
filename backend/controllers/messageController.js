import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

import { getIO } from "../socket/socketManager.js";
import { notifyChatParticipants } from "../socket/chatNotify.js";
import { serverError } from "../utils/serverError.js";
import { assertChatMessagingAllowed } from "../utils/bookingAccess.js";
import { getMessageTypeFromMime, getMaxSizeForMime } from "../utils/fileType.js";
import { uploadFile, deleteFile } from "../utils/gridfs.js";

const SENDER_FIELDS =
  "username email profilePicture";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const isChatParticipant = (chat, userId) =>
  chat.participants.some(
    (id) => id.toString() === userId.toString()
  );

const populateMessage = (query) =>
  query
    .populate("sender", SENDER_FIELDS)
    .populate("reactions.user", "username");

const getMessageForUser = async (
  messageId,
  userId
) => {
  const message = await Message.findById(
    messageId
  );

  if (!message) {
    return { error: { status: 404, message: "Message not found" } };
  }

  const chat = await Chat.findById(message.chat);

  if (!chat) {
    return { error: { status: 404, message: "Chat not found" } };
  }

  if (!isChatParticipant(chat, userId)) {
    return { error: { status: 403, message: "Forbidden" } };
  }

  return { message, chat };
};

const buildReplySnapshot = async (
  replyToMessageId,
  chatId
) => {
  const original = await Message.findById(
    replyToMessageId
  ).populate("sender", "username");

  if (
    !original ||
    original.chat.toString() !== chatId.toString()
  ) {
    return null;
  }

  const senderUsername =
    original.sender?.username ?? "Unknown";

  let preview = original.content?.trim() ?? "";

  if (original.messageType === "image") {
    preview = "Photo";
  } else if (original.messageType === "video") {
    preview = "Video";
  } else if (original.messageType === "document") {
    preview =
      original.attachment?.fileName || "Document";
  } else if (preview.length > 200) {
    preview = `${preview.slice(0, 200)}...`;
  }

  return {
    messageId: original._id,
    senderUsername,
    content: preview,
    messageType: original.messageType || "text",
  };
};

const populateLastMessage = async (messageId) => {
  if (!messageId) {
    return null;
  }

  return populateMessage(
    Message.findById(messageId)
  );
};

const markChatMessagesAsRead = async (
  chatId,
  userId
) => {
  await Message.updateMany(
    {
      chat: chatId,
      readBy: { $nin: [userId] },
    },
    {
      $addToSet: {
        readBy: userId,
        deliveredTo: userId,
      },
    }
  );
};

const notifyMessagesRead = (chat, readerId) => {
  const io = getIO();

  chat.participants
    .filter(
      (id) =>
        id.toString() !==
        readerId.toString()
    )
    .forEach((id) => {
      io.to(id.toString()).emit(
        "messagesRead",
        {
          chatId: chat._id.toString(),
          readBy: readerId.toString(),
        }
      );
    });
};

const notifyMessageDelivered = (
  message,
  deliveredToUserId
) => {
  const io = getIO();

  io.to(message.sender.toString()).emit(
    "messageDelivered",
    {
      messageId: message._id.toString(),
      chatId: message.chat.toString(),
      deliveredTo: deliveredToUserId.toString(),
    }
  );
};

export const markMessageDelivered = async (
  req,
  res
) => {
  try {
    const message = await Message.findById(
      req.params.messageId
    );

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const chat = await Chat.findById(
      message.chat
    );

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (
      message.sender.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot mark own message as delivered",
      });
    }

    const updated = await Message.findByIdAndUpdate(
      message._id,
      {
        $addToSet: {
          deliveredTo: req.user._id,
        },
      },
      { new: true }
    );

    notifyMessageDelivered(
      updated,
      req.user._id
    );

    res.status(200).json(updated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const markChatAsRead = async (req, res) => {
  try {
    const chat = await Chat.findById(
      req.params.chatId
    );

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const chatAccess =
      await assertChatMessagingAllowed(
        req.params.chatId
      );

    if (!chatAccess.allowed) {
      return res.status(403).json({
        message: chatAccess.message,
      });
    }

    await markChatMessagesAsRead(
      req.params.chatId,
      req.user._id
    );

    notifyMessagesRead(
      chat,
      req.user._id
    );

    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, replyToMessageId } =
      req.body;
    const file = req.file;

    const trimmedContent = content?.trim() ?? "";

    if (!chatId) {
      return res.status(400).json({
        message: "Chat ID is required",
      });
    }

    if (!file && !trimmedContent) {
      return res.status(400).json({
        message: "Message content or file is required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const chatAccess =
      await assertChatMessagingAllowed(chatId);

    if (!chatAccess.allowed) {
      return res.status(403).json({
        message: chatAccess.message,
      });
    }

    let replyTo = null;

    if (replyToMessageId) {
      replyTo = await buildReplySnapshot(
        replyToMessageId,
        chatId
      );

      if (!replyTo) {
        return res.status(400).json({
          message: "Reply message not found in this chat",
        });
      }
    }

    let attachment = null;
    let messageType = "text";
    let uploadedFileId = null;

    if (file) {
      const maxSize = getMaxSizeForMime(file.mimetype);

      if (file.size > maxSize) {
        return res.status(400).json({
          message: "File exceeds maximum allowed size for this type",
        });
      }

      const derivedType = getMessageTypeFromMime(
        file.mimetype
      );

      if (!derivedType) {
        return res.status(400).json({
          message: "File type not allowed",
        });
      }

      if (!file.buffer?.length) {
        return res.status(400).json({
          message: "No file received. Upload may have failed.",
        });
      }

      try {
        uploadedFileId = await uploadFile(
          file.buffer,
          {
            fileName: file.originalname,
            mimeType: file.mimetype,
            chatId,
            senderId: req.user._id,
          }
        );
      } catch (uploadError) {
        console.error("GridFS upload failed:", uploadError);

        return res.status(500).json({
          message: "Failed to store file",
        });
      }

      messageType = derivedType;
      attachment = {
        fileId: uploadedFileId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    let message;

    const messagePayload = {
      chat: chatId,
      sender: req.user._id,
      messageType,
      content: trimmedContent,
      readBy: [req.user._id],
      deliveredTo: [],
    };

    if (attachment) {
      messagePayload.attachment = attachment;
    }

    if (replyTo) {
      messagePayload.replyTo = replyTo;
    }

    try {
      message = await Message.create(messagePayload);
    } catch (error) {
      if (uploadedFileId) {
        await deleteFile(uploadedFileId).catch(
          console.error
        );
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: error.message,
        });
      }

      throw error;
    }

    await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id
      },
      { timestamps: true }
    );

    const populatedMessage = await populateMessage(
      Message.findById(message._id)
    );

    notifyChatParticipants(
      chat,
      req.user._id,
      "newMessage",
      populatedMessage
    );

    res.status(201).json(
      populatedMessage
    );

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return serverError(res, error);
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    const result = await getMessageForUser(
      req.params.messageId,
      req.user._id
    );

    if (result.error) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const { message, chat } = result;

    if (
      message.sender.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only edit your own messages",
      });
    }

    if (message.messageType !== "text") {
      return res.status(400).json({
        message: "Only text messages can be edited",
      });
    }

    const ageMs =
      Date.now() -
      new Date(message.createdAt).getTime();

    if (ageMs > EDIT_WINDOW_MS) {
      return res.status(403).json({
        message:
          "Messages can only be edited within 15 minutes of sending",
      });
    }

    message.content = trimmedContent;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await populateMessage(
      Message.findById(message._id)
    );

    notifyChatParticipants(
      chat,
      req.user._id,
      "messageUpdated",
      populatedMessage
    );

    res.status(200).json(populatedMessage);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return serverError(res, error);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const result = await getMessageForUser(
      req.params.messageId,
      req.user._id
    );

    if (result.error) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const { message, chat } = result;

    if (
      message.sender.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only delete your own messages",
      });
    }

    if (message.attachment?.fileId) {
      await deleteFile(
        message.attachment.fileId
      ).catch(console.error);
    }

    const wasLastMessage =
      chat.lastMessage?.toString() ===
      message._id.toString();

    await Message.findByIdAndDelete(message._id);

    let lastMessage = null;

    if (wasLastMessage) {
      const previous = await Message.findOne({
        chat: chat._id,
      }).sort({ createdAt: -1 });

      await Chat.findByIdAndUpdate(
        chat._id,
        {
          lastMessage: previous?._id ?? null,
        },
        { timestamps: true }
      );

      lastMessage = await populateLastMessage(
        previous?._id
      );
    }

    const payload = {
      messageId: message._id.toString(),
      chatId: chat._id.toString(),
      lastMessage,
    };

    notifyChatParticipants(
      chat,
      req.user._id,
      "messageDeleted",
      payload
    );

    res.status(200).json(payload);
  } catch (error) {
    return serverError(res, error);
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji?.trim()) {
      return res.status(400).json({
        message: "Emoji is required",
      });
    }

    const result = await getMessageForUser(
      req.params.messageId,
      req.user._id
    );

    if (result.error) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const { message, chat } = result;
    const userId = req.user._id.toString();

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(
      (reaction) =>
        reaction.user.toString() === userId
    );

    if (existingIndex >= 0) {
      const existing = reactions[existingIndex];

      if (existing.emoji === emoji) {
        reactions.splice(existingIndex, 1);
      } else {
        reactions[existingIndex].emoji = emoji;
      }
    } else {
      reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    message.reactions = reactions;
    await message.save();

    const populatedMessage = await populateMessage(
      Message.findById(message._id)
    );

    notifyChatParticipants(
      chat,
      req.user._id,
      "messageUpdated",
      populatedMessage
    );

    res.status(200).json(populatedMessage);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (!isChatParticipant(chat, req.user._id)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const chatAccess =
      await assertChatMessagingAllowed(
        req.params.chatId
      );

    if (!chatAccess.allowed) {
      return res.status(403).json({
        message: chatAccess.message,
      });
    }

    const { before, after } = req.query;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      100
    );

    if (before && after) {
      return res.status(400).json({
        message: "Use either before or after, not both",
      });
    }

    const filter = { chat: req.params.chatId };

    if (before) {
      const beforeMessage = await Message.findById(before);

      if (!beforeMessage) {
        return res.status(400).json({
          message: "Invalid before cursor",
        });
      }

      filter.createdAt = { $lt: beforeMessage.createdAt };
    } else if (after) {
      const afterMessage = await Message.findById(after);

      if (!afterMessage) {
        return res.status(400).json({
          message: "Invalid after cursor",
        });
      }

      filter.createdAt = { $gt: afterMessage.createdAt };
    }

    const sortOrder = after ? 1 : -1;

    const rawMessages = await populateMessage(
      Message.find(filter)
        .sort({ createdAt: sortOrder })
        .limit(limit + 1)
    );

    const hasMore = rawMessages.length > limit;
    const page = hasMore
      ? rawMessages.slice(0, limit)
      : rawMessages;

    const messages = after ? page : page.reverse();

    res.status(200).json({
      messages,
      hasMore,
    });

  } catch (error) {
    return serverError(res, error);
  }
};