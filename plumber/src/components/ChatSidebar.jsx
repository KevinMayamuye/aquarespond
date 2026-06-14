import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

import { getChats, getOrCreateSupportChat } from "../services/chatService";
import { markMessageDelivered } from "../services/messageService";

import {
  getMessageStatus,
  hasReadByUser,
  updateParticipantStatus,
} from "../utils/messageStatus";
import { getMessagePreviewText } from "../utils/messagePreview";
import {
  getChatTitle,
  getGroupAvatarUser,
  getSupportAvatarUser,
  getGroupMessageStatus,
  getOtherParticipant,
  getSidebarPreviewSender,
  isGroupChat,
} from "../utils/chatDisplay";

import { socket } from "../socket/socket";

import Avatar from "./Avatar";
import MessageTicks from "./MessageTicks";

const ChatSidebar = () => {
  const { user } = useAuth();

  const { selectedChat, setSelectedChat } =
    useChat();

  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    try {
      const data = await getChats();

      setChats(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getChats()
      .then((data) => {
        if (!cancelled) {
          setChats(data);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants:
            updateParticipantStatus(
              chat.participants,
              userId,
              isOnline,
              lastSeen
            ),
        }))
      );
    };

    const handleNewMessage = async (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      const senderId =
        message.sender?._id ??
        message.sender;

      const isIncoming =
        senderId?.toString() !==
        user._id?.toString();

      const isChatOpen =
        selectedChat?._id?.toString() ===
        chatId?.toString();

      if (isChatOpen) {
        setSelectedChat((prev) => {
          if (
            !prev ||
            prev._id?.toString() !==
              chatId?.toString()
          ) {
            return prev;
          }

          return {
            ...prev,
            lastMessage: message,
            updatedAt: message.createdAt,
          };
        });
      }

      if (isIncoming && !isChatOpen) {
        markMessageDelivered(message._id).catch(
          console.error
        );
      }

      let shouldRefetch = false;

      setChats((prev) => {
        if (
          !prev.some(
            (chat) =>
              chat._id?.toString() ===
              chatId?.toString()
          )
        ) {
          shouldRefetch = true;
          return prev;
        }

        const updated = prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount:
              isIncoming && !isChatOpen
                ? (chat.unreadCount || 0) + 1
                : isChatOpen
                  ? 0
                  : chat.unreadCount || 0,
          };
        });

        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        );
      });

      if (shouldRefetch) {
        await fetchChats();
      }
    };

    const handleMessagesRead = ({
      chatId,
      readBy,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString() ||
            !chat.lastMessage
          ) {
            return chat;
          }

          const senderId =
            chat.lastMessage.sender._id ??
            chat.lastMessage.sender;

          if (
            senderId?.toString() !==
            user._id?.toString()
          ) {
            return chat;
          }

          if (
            hasReadByUser(
              chat.lastMessage.readBy,
              readBy
            )
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              readBy: [
                ...(chat.lastMessage.readBy ||
                  []),
                readBy,
              ],
            },
          };
        })
      );
    };

    const handleMessageDelivered = ({
      messageId,
      chatId,
      deliveredTo,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (
            chat._id?.toString() !==
              chatId?.toString() ||
            !chat.lastMessage ||
            chat.lastMessage._id?.toString() !==
              messageId?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              deliveredTo: [
                ...(chat.lastMessage
                  .deliveredTo || []),
                deliveredTo,
              ],
            },
          };
        })
      );
    };

    const handleMessageUpdated = (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      setChats((prev) =>
        prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString()
          ) {
            return chat;
          }

          const lastId =
            chat.lastMessage?._id ??
            chat.lastMessage;

          if (
            lastId?.toString() !==
            message._id?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: message,
          };
        })
      );
    };

    const handleMessageDeleted = ({
      messageId,
      chatId,
      lastMessage,
    }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (
            chat._id?.toString() !==
            chatId?.toString()
          ) {
            return chat;
          }

          const lastId =
            chat.lastMessage?._id ??
            chat.lastMessage;

          if (
            lastId?.toString() !==
            messageId?.toString()
          ) {
            return chat;
          }

          return {
            ...chat,
            lastMessage: lastMessage ?? null,
            updatedAt:
              lastMessage?.createdAt ||
              chat.updatedAt,
          };
        }).sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        )
      );
    };

    const handleChatAdded = (chat) => {
      setChats((prev) => {
        const exists = prev.some(
          (item) =>
            item._id?.toString() ===
            chat._id?.toString()
        );

        if (exists) {
          return prev;
        }

        return [chat, ...prev];
      });
    };

    const handleBookingRefresh = (booking) => {
      if (!booking.chat) return;

      const closedStatuses = [
        "completed",
        "cancelled",
        "declined",
      ];

      if (booking.status === "accepted") {
        fetchChats();
        return;
      }

      if (closedStatuses.includes(booking.status)) {
        fetchChats();

        const chatId =
          booking.chat._id ?? booking.chat;

        if (
          selectedChat?._id?.toString() ===
          chatId?.toString()
        ) {
          setSelectedChat((prev) =>
            prev
              ? { ...prev, activeBooking: null }
              : null
          );
        }
      }
    };

    socket.on(
      "userStatusChange",
      handleUserStatus
    );
    socket.on("newMessage", handleNewMessage);
    socket.on(
      "messagesRead",
      handleMessagesRead
    );
    socket.on(
      "messageDelivered",
      handleMessageDelivered
    );
    socket.on(
      "messageUpdated",
      handleMessageUpdated
    );
    socket.on(
      "messageDeleted",
      handleMessageDeleted
    );
    socket.on("chatAdded", handleChatAdded);
    socket.on(
      "bookingUpdated",
      handleBookingRefresh
    );

    return () => {
      socket.off(
        "userStatusChange",
        handleUserStatus
      );
      socket.off(
        "newMessage",
        handleNewMessage
      );
      socket.off(
        "messagesRead",
        handleMessagesRead
      );
      socket.off(
        "messageDelivered",
        handleMessageDelivered
      );
      socket.off(
        "messageUpdated",
        handleMessageUpdated
      );
      socket.off(
        "messageDeleted",
        handleMessageDeleted
      );
      socket.off("chatAdded", handleChatAdded);
      socket.off(
        "bookingUpdated",
        handleBookingRefresh
      );
    };
  }, [selectedChat, user._id, setSelectedChat]);

  const handleChatClick = (chat) => {
    setSelectedChat(chat);

    setChats((prev) =>
      prev.map((c) =>
        c._id?.toString() ===
        chat._id?.toString()
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const hasSupportChat = chats.some(
    (chat) => chat.isSupportChat
  );

  const handleMessageSupport = async () => {
    try {
      const chat = await getOrCreateSupportChat();

      setChats((prev) => {
        const exists = prev.some(
          (item) =>
            item._id?.toString() ===
            chat._id?.toString()
        );

        if (exists) {
          return prev.map((item) =>
            item._id?.toString() ===
            chat._id?.toString()
              ? chat
              : item
          );
        }

        return [chat, ...prev];
      });

      setSelectedChat(chat);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Could not open support chat"
      );
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h2>Chat</h2>
      </div>

      <div className="sidebar-section">
        {!hasSupportChat &&
          user?.role !== "admin" && (
          <button
            type="button"
            className="support-chat-btn"
            onClick={handleMessageSupport}
          >
            Message Support
          </button>
        )}

        {chats.length === 0 ? (
          <p className="sidebar-empty">
            No active chats. Book a plumber and
            chat once they accept your booking, or
            message Support for help.
          </p>
        ) : (
          chats.map((chat) => {
            const isGroup = isGroupChat(chat);
            const isSupport = chat.isSupportChat;

            const otherUser = isGroup
              ? null
              : getOtherParticipant(
                  chat,
                  user._id
                );

            const chatTitle = getChatTitle(
              chat,
              user._id
            );

            const avatarUser = isSupport
              ? getSupportAvatarUser()
              : isGroup
                ? getGroupAvatarUser(chat)
                : otherUser;

            const isSelected =
              selectedChat?._id?.toString() ===
              chat._id?.toString();

            const lastMessage =
              chat.lastMessage;

            const lastSenderId =
              lastMessage?.sender?._id ??
              lastMessage?.sender;

            const isLastMessageMine =
              lastSenderId?.toString() ===
              user._id?.toString();

            const lastMessageStatus =
              isLastMessageMine && lastMessage
                ? isGroup
                  ? getGroupMessageStatus(
                      lastMessage,
                      chat,
                      user._id
                    )
                  : getMessageStatus(
                      lastMessage,
                      otherUser?._id
                    )
                : null;

            const previewSender =
              getSidebarPreviewSender(
                lastMessage,
                chat,
                user._id
              );

            const previewText =
              getMessagePreviewText(
                lastMessage
              );

            const unreadCount =
              chat.unreadCount || 0;

            return (
              <div
                key={chat._id}
                className={`chat-item ${
                  isSelected ? "active" : ""
                }${isGroup ? " group" : ""}${
                  isSupport ? " support" : ""
                }`}
                onClick={() =>
                  handleChatClick(chat)
                }
              >
                <div className="chat-item-top">
                  <div className="chat-item-name">
                    <Avatar
                      user={avatarUser}
                      size="sm"
                    />

                    {!isGroup && (
                      <span
                        className={`status-dot ${
                          otherUser?.isOnline
                            ? "online"
                            : ""
                        }`}
                      />
                    )}

                    {chatTitle}
                  </div>

                  {unreadCount > 0 && (
                    <span className="unread-badge">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
                </div>

                {lastMessage && (
                  <div className="chat-item-preview">
                    {isLastMessageMine && (
                      <MessageTicks
                        status={
                          lastMessageStatus
                        }
                      />
                    )}

                    <span className="preview-text">
                      {previewSender
                        ? `${previewSender}: ${previewText}`
                        : previewText}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
