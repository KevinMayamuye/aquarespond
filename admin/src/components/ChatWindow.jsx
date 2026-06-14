import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

import {
  getMessages,
  markChatAsRead,
  markMessageDelivered,
} from "../services/messageService";

import {
  formatLastSeen,
  getMessageStatus,
  hasReadByUser,
  updateParticipantStatus,
} from "../utils/messageStatus";

import { canEditMessage } from "../utils/messagePreview";
import {
  getChatTitle,
  getGroupAvatarUser,
  getGroupMessageStatus,
  getOtherParticipant,
  getParticipantById,
  isGroupChat,
} from "../utils/chatDisplay";

import { socket } from "../socket/socket";

import MessageInput from "./MessageInput";
import MessageTicks from "./MessageTicks";
import MessageAttachment from "./MessageAttachment";
import MessageActions from "./MessageActions";
import MessageReplyPreview from "./MessageReplyPreview";
import ReactionBar from "./ReactionBar";
import Avatar from "./Avatar";
import ContactProfileModal from "./ContactProfileModal";
import GroupInfoModal from "./GroupInfoModal";
import TypingIndicator from "./TypingIndicator";

const ChatWindow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { selectedChat, setSelectedChat } =
    useChat();

  const selectedChatId = selectedChat?._id;

  const [messages, setMessages] = useState([]);
  const [messagesChatId, setMessagesChatId] =
    useState(null);
  const [statusByUserId, setStatusByUserId] =
    useState({});
  const [showContactProfile, setShowContactProfile] =
    useState(false);
  const [showGroupInfo, setShowGroupInfo] =
    useState(false);
  const [replyingTo, setReplyingTo] =
    useState(null);
  const [editingMessage, setEditingMessage] =
    useState(null);
  const [isOtherUserTyping, setIsOtherUserTyping] =
    useState(false);
  const [typingUserName, setTypingUserName] =
    useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedChatIdRef = useRef(selectedChatId);
  const selectedChatRef = useRef(selectedChat);
  const replyingToRef = useRef(replyingTo);
  const editingMessageRef = useRef(editingMessage);
  const otherUserIdRef = useRef(null);
  const userIdRef = useRef(user._id);
  const fetchGenerationRef = useRef(0);

  const derivedOtherUser = useMemo(() => {
    if (!selectedChatId || !selectedChat) {
      return null;
    }

    if (isGroupChat(selectedChat)) {
      return null;
    }

    return (
      getOtherParticipant(
        selectedChat,
        user._id
      ) ?? null
    );
  }, [selectedChatId, selectedChat, user._id]);

  const otherUser = useMemo(() => {
    if (!derivedOtherUser) {
      return null;
    }

    const userId =
      derivedOtherUser._id?.toString();
    const overlay = statusByUserId[userId];

    return overlay
      ? { ...derivedOtherUser, ...overlay }
      : derivedOtherUser;
  }, [derivedOtherUser, statusByUserId]);

  useLayoutEffect(() => {
    selectedChatIdRef.current = selectedChatId;
    selectedChatRef.current = selectedChat;
    replyingToRef.current = replyingTo;
    editingMessageRef.current = editingMessage;
    otherUserIdRef.current = otherUser?._id;
    userIdRef.current = user._id;
  });

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const updateLastMessageIfNeeded = (
    updatedMessage
  ) => {
    setSelectedChat((prev) => {
      if (!prev) return prev;

      const lastId =
        prev.lastMessage?._id ??
        prev.lastMessage;

      if (
        lastId?.toString() !==
        updatedMessage._id?.toString()
      ) {
        return prev;
      }

      return {
        ...prev,
        lastMessage: updatedMessage,
      };
    });
  };

  const handleReactionUpdate = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id
          ? updatedMessage
          : msg
      )
    );

    updateLastMessageIfNeeded(updatedMessage);
  };

  const handleMessageDeleted = ({
    messageId,
    chatId,
    lastMessage,
  }) => {
    if (
      chatId?.toString() !==
      selectedChatIdRef.current?.toString()
    ) {
      return;
    }

    setMessages((prev) =>
      prev.filter(
        (msg) =>
          msg._id?.toString() !==
          messageId?.toString()
      )
    );

    setSelectedChat((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        lastMessage: lastMessage ?? null,
      };
    });

    if (
      replyingToRef.current?._id?.toString() ===
      messageId?.toString()
    ) {
      setReplyingTo(null);
    }

    if (
      editingMessageRef.current?._id?.toString() ===
      messageId?.toString()
    ) {
      setEditingMessage(null);
    }
  };

  const handleLocalDelete = (result) => {
    handleMessageDeleted(result);
  };

  const handleReply = (message) => {
    setEditingMessage(null);
    setReplyingTo(message);
  };

  const handleEdit = (message) => {
    if (!canEditMessage(message)) {
      alert(
        "Messages can only be edited within 15 minutes of sending"
      );
      return;
    }

    setReplyingTo(null);
    setEditingMessage(message);
  };

  const displayedMessages = useMemo(
    () =>
      messagesChatId === selectedChatId
        ? messages
        : [],
    [messagesChatId, selectedChatId, messages]
  );

  const displayedHasMore = useMemo(
    () =>
      messagesChatId === selectedChatId
        ? hasMore
        : false,
    [messagesChatId, selectedChatId, hasMore]
  );

  const fetchMessages = useCallback(async (
    chatId,
    generation
  ) => {
    try {
      const { messages: fetched, hasMore: more } =
        await getMessages(chatId);

      if (
        generation !== fetchGenerationRef.current
      ) {
        return;
      }

      setMessages(fetched);
      setMessagesChatId(chatId);
      setHasMore(more);
      setReplyingTo(null);
      setEditingMessage(null);
      setIsOtherUserTyping(false);
      setTypingUserName("");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      try {
        await markChatAsRead(chatId);

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
            unreadCount: 0,
          };
        });
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  }, [setSelectedChat]);

  const loadEarlierMessages = async () => {
    if (
      !selectedChatId ||
      !displayedHasMore ||
      loadingMore ||
      displayedMessages.length === 0
    ) {
      return;
    }

    const container = messagesContainerRef.current;
    const previousScrollHeight =
      container?.scrollHeight ?? 0;

    setLoadingMore(true);

    try {
      const { messages: older, hasMore: more } =
        await getMessages(selectedChatId, {
          before: displayedMessages[0]._id,
        });

      setMessages((prev) => [...older, ...prev]);
      setHasMore(more);

      requestAnimationFrame(() => {
        if (!container) return;

        container.scrollTop =
          container.scrollHeight -
          previousScrollHeight;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (
      !selectedChat ||
      (displayedMessages.length === 0 &&
        !isOtherUserTyping)
    ) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => cancelAnimationFrame(frameId);
  }, [
    displayedMessages,
    selectedChatId,
    isOtherUserTyping,
    selectedChat,
  ]);

  useEffect(() => {
    if (!selectedChatId) return;

    const generation = ++fetchGenerationRef.current;

    fetchMessages(selectedChatId, generation);
  }, [selectedChatId, fetchMessages]);

  useEffect(() => {
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }) => {
      const chat = selectedChatRef.current;

      const isParticipant = chat?.participants?.some(
        (p) =>
          p._id?.toString() ===
          userId?.toString()
      );

      if (!isParticipant) {
        return;
      }

      if (
        userId?.toString() ===
        otherUserIdRef.current?.toString()
      ) {
        setStatusByUserId((prev) => ({
          ...prev,
          [userId.toString()]: {
            isOnline,
            lastSeen,
          },
        }));
      }

      setSelectedChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants:
            updateParticipantStatus(
              prev.participants,
              userId,
              isOnline,
              lastSeen
            ),
        };
      });
    };

    const handleMessagesRead = ({
      chatId,
      readBy,
    }) => {
      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (
            message.sender?._id?.toString() !==
            userIdRef.current?.toString()
          ) {
            return message;
          }

          if (
            hasReadByUser(
              message.readBy,
              readBy
            )
          ) {
            return message;
          }

          return {
            ...message,
            readBy: [
              ...(message.readBy || []),
              readBy,
            ],
          };
        })
      );
    };

    const handleMessageDelivered = ({
      messageId,
      chatId,
      deliveredTo,
    }) => {
      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          if (
            message._id?.toString() !==
            messageId?.toString()
          ) {
            return message;
          }

          return {
            ...message,
            deliveredTo: [
              ...(message.deliveredTo || []),
              deliveredTo,
            ],
          };
        })
      );
    };

    const handleMessageUpdated = (message) => {
      const messageChatId =
        message.chat?._id ?? message.chat;

      if (
        messageChatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === message._id
            ? message
            : msg
        )
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;

        const lastId =
          prev.lastMessage?._id ??
          prev.lastMessage;

        if (
          lastId?.toString() !==
          message._id?.toString()
        ) {
          return prev;
        }

        return {
          ...prev,
          lastMessage: message,
        };
      });
    };

    const handleMessageDeletedEvent = (payload) => {
      const {
        messageId,
        chatId,
        lastMessage,
      } = payload;

      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.filter(
          (msg) =>
            msg._id?.toString() !==
            messageId?.toString()
        )
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          lastMessage: lastMessage ?? null,
        };
      });

      if (
        replyingToRef.current?._id?.toString() ===
        messageId?.toString()
      ) {
        setReplyingTo(null);
      }

      if (
        editingMessageRef.current?._id?.toString() ===
        messageId?.toString()
      ) {
        setEditingMessage(null);
      }
    };

    const clearTypingFallback = () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };

    const handleUserTyping = ({
      chatId,
      userId,
      isTyping,
    }) => {
      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      if (
        userId?.toString() ===
        userIdRef.current?.toString()
      ) {
        return;
      }

      const chat = selectedChatRef.current;
      const isParticipant = chat?.participants?.some(
        (p) =>
          p._id?.toString() ===
          userId?.toString()
      );

      if (!isParticipant) {
        return;
      }

      if (
        !isGroupChat(chat) &&
        userId?.toString() !==
          otherUserIdRef.current?.toString()
      ) {
        return;
      }

      clearTypingFallback();

      if (isTyping) {
        const typingUser = getParticipantById(
          chat,
          userId
        );

        setTypingUserName(
          typingUser?.username ?? "Someone"
        );
        setIsOtherUserTyping(true);

        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
          setTypingUserName("");
          typingTimeoutRef.current = null;
        }, 3000);
      } else {
        setIsOtherUserTyping(false);
        setTypingUserName("");
      }
    };

    const handleNewMessage = async (message) => {
      const messageChatId =
        message.chat?._id ?? message.chat;

      if (
        messageChatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setIsOtherUserTyping(false);
      setTypingUserName("");
      clearTypingFallback();

      const isOwnMessage =
        message.sender?._id?.toString() ===
        userIdRef.current?.toString();

      if (!isOwnMessage) {
        try {
          await markChatAsRead(
            selectedChatIdRef.current
          );

          await markMessageDelivered(
            message._id
          );

          message = {
            ...message,
            readBy: [
              ...(message.readBy || []),
              userIdRef.current,
            ],
            deliveredTo: [
              ...(message.deliveredTo || []),
              userIdRef.current,
            ],
          };
        } catch (error) {
          console.error(error);
        }
      }

      setMessages((prev) => {
        const exists = prev.some(
          (msg) => msg._id === message._id
        );

        if (exists) {
          return prev;
        }

        return [...prev, message];
      });
    };

    socket.on(
      "userStatusChange",
      handleUserStatus
    );
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
      handleMessageDeletedEvent
    );
    socket.on(
      "newMessage",
      handleNewMessage
    );
    socket.on(
      "userTyping",
      handleUserTyping
    );

    return () => {
      clearTypingFallback();
      socket.off(
        "userStatusChange",
        handleUserStatus
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
        handleMessageDeletedEvent
      );
      socket.off(
        "newMessage",
        handleNewMessage
      );
      socket.off(
        "userTyping",
        handleUserTyping
      );
    };
  }, [selectedChatId, setSelectedChat]);

  const messagingEnabled = Boolean(
    selectedChat?.messagingAllowed ??
      selectedChat?.activeBooking ??
      selectedChat?.isSupportChat
  );

  useEffect(() => {
    const handleBookingUpdated = (booking) => {
      if (!booking.chat || !selectedChatIdRef.current) {
        return;
      }

      const chatId =
        booking.chat._id ?? booking.chat;

      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      if (booking.status === "accepted") {
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                activeBooking: {
                  _id: booking._id,
                  status: booking.status,
                  scheduledAt: booking.scheduledAt,
                  serviceType: booking.serviceType,
                },
              }
            : prev
        );
        return;
      }

      if (
        ["completed", "cancelled", "declined"].includes(
          booking.status
        )
      ) {
        setSelectedChat((prev) =>
          prev
            ? { ...prev, activeBooking: null }
            : prev
        );
      }
    };

    socket.on(
      "bookingUpdated",
      handleBookingUpdated
    );

    return () => {
      socket.off(
        "bookingUpdated",
        handleBookingUpdated
      );
    };
  }, [setSelectedChat]);

  if (!selectedChat) {
    return (
      <div className="chat-window">
        <div className="chat-placeholder">
          Select a user to start chatting
        </div>
      </div>
    );
  }

  const isGroup = isGroupChat(selectedChat);
  const headerTitle = getChatTitle(
    selectedChat,
    user._id,
    user.role
  );
  const headerAvatarUser = isGroup
    ? getGroupAvatarUser(selectedChat)
    : otherUser;
  const memberCount =
    selectedChat.participants?.length ?? 0;

  const statusText = isOtherUserTyping
    ? isGroup && typingUserName
      ? `${typingUserName} is typing...`
      : "typing..."
    : isGroup
      ? `${memberCount} members`
      : formatLastSeen(
          otherUser?.isOnline,
          otherUser?.lastSeen
        );

  const handleHeaderClick = () => {
    if (isGroup) {
      setShowGroupInfo(true);
    } else {
      setShowContactProfile(true);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button
          type="button"
          className="chat-back-btn"
          onClick={() => setSelectedChat(null)}
          aria-label="Back to chats"
        >
          ←
        </button>

        <button
          type="button"
          className="chat-header-profile"
          onClick={handleHeaderClick}
        >
          <Avatar
            user={headerAvatarUser}
            size="md"
          />

          <div>
            <div className="chat-header-name">
              {headerTitle}
            </div>

            <div
              className={`chat-header-status ${
                isOtherUserTyping
                  ? "typing"
                  : !isGroup && otherUser?.isOnline
                    ? "online"
                    : ""
              }`}
            >
              {statusText}
            </div>
          </div>
        </button>
      </div>

      <div
        className="messages"
        ref={messagesContainerRef}
      >
        {displayedHasMore && (
          <div className="load-more-messages">
            <button
              type="button"
              className="load-more-btn"
              onClick={loadEarlierMessages}
              disabled={loadingMore}
            >
              {loadingMore
                ? "Loading..."
                : "Load earlier messages"}
            </button>
          </div>
        )}

        {displayedMessages.map((message) => {
          const isSent =
            message.sender?._id?.toString() ===
            user._id?.toString();

          const status = isSent
            ? isGroup
              ? getGroupMessageStatus(
                  message,
                  selectedChat,
                  user._id
                )
              : getMessageStatus(
                  message,
                  otherUser?._id
                )
            : null;

          const showSenderName =
            isGroup &&
            message.sender?.username;

          const hasAttachment =
            message.messageType &&
            message.messageType !== "text";

          return (
            <div
              key={message._id}
              className={`message ${
                isSent ? "sent" : "received"
              }${message.pending ? " pending" : ""}${
                hasAttachment
                  ? " message-has-attachment"
                  : ""
              }`}
            >
              <div className="message-body">
                {showSenderName && !isSent && (
                  <span className="message-sender-name">
                    {message.sender.username}
                  </span>
                )}

                {message.replyTo && (
                  <MessageReplyPreview
                    replyTo={message.replyTo}
                  />
                )}

                {hasAttachment ? (
                  <MessageAttachment
                    message={message}
                  />
                ) : (
                  <div className="message-content">
                    {message.content}
                  </div>
                )}

                {message.editedAt && (
                  <span className="message-edited-label">
                    (edited)
                  </span>
                )}

                {isSent && (
                  <div className="message-meta">
                    <MessageTicks
                      status={status}
                    />
                  </div>
                )}
              </div>

              {!message.pending && (
                <>
                  <ReactionBar
                    message={message}
                    currentUserId={user._id}
                    onReactionUpdate={
                      handleReactionUpdate
                    }
                  />

                  <MessageActions
                    message={message}
                    currentUserId={user._id}
                    isSent={isSent}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleLocalDelete}
                    onReactionUpdate={
                      handleReactionUpdate
                    }
                  />
                </>
              )}
            </div>
          );
        })}

        {isOtherUserTyping && <TypingIndicator />}
      </div>

      {!messagingEnabled && (
        <div className="chat-closed-banner">
          <p>
            This job is complete. Rebook from the
            Book tab to continue chatting.
          </p>
          <button
            type="button"
            className="chat-rebook-btn"
            onClick={() =>
              navigate("/dashboard/book", {
                state: {
                  rebookFrom: {
                    plumber: otherUser,
                  },
                },
              })
            }
          >
            Rebook plumber
          </button>
        </div>
      )}

      <MessageInput
        key={`${selectedChatId}-${editingMessage?._id ?? "compose"}`}
        selectedChat={selectedChat}
        setMessages={setMessages}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() =>
          setEditingMessage(null)
        }
        onMessageUpdated={
          updateLastMessageIfNeeded
        }
        disabled={!messagingEnabled}
        disabledReason="This job is complete. Rebook to continue chatting."
      />

      {showContactProfile && otherUser && (
        <ContactProfileModal
          userId={otherUser._id}
          initialUser={otherUser}
          onClose={() => setShowContactProfile(false)}
        />
      )}

      {showGroupInfo && (
        <GroupInfoModal
          chat={selectedChat}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
