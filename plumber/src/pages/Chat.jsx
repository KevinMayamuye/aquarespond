import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";
import { getChats } from "../services/chatService";
import {
  getMessages,
  markChatAsRead,
  sendMessage,
} from "../services/messageService";

import { socket } from "../socket/socket";

import "../styles/chat.css";

const Chat = () => {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] =
    useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesChatId, setMessagesChatId] =
    useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedChatIdRef = useRef(null);

  const displayedMessages =
    messagesChatId === selectedChat?._id
      ? messages
      : [];

  const messagingEnabled = Boolean(
    selectedChat?.activeBooking
  );

  const getOtherUser = (chat) =>
    chat.participants?.find(
      (p) =>
        p._id?.toString() !==
        user._id?.toString()
    );

  useEffect(() => {
    let cancelled = false;

    getChats()
      .then((data) => {
        if (!cancelled) {
          setChats(data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    selectedChatIdRef.current =
      selectedChat?._id;

    if (!selectedChat?._id) {
      return;
    }

    let cancelled = false;
    const chatId = selectedChat._id;

    getMessages(chatId)
      .then(({ messages: fetched }) => {
        if (cancelled) return;

        setMessages(fetched);
        setMessagesChatId(chatId);
      })
      .catch(console.error);

    markChatAsRead(chatId).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedChat?._id]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      const chatId =
        message.chat?._id ?? message.chat;

      if (
        chatId?.toString() !==
        selectedChatIdRef.current?.toString()
      ) {
        return;
      }

      setMessages((prev) => {
        if (
          prev.some(
            (item) =>
              item._id?.toString() ===
              message._id?.toString()
          )
        ) {
          return prev;
        }

        return [...prev, message];
      });
    };

    const handleChatAdded = (chat) => {
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
              ? { ...item, ...chat }
              : item
          );
        }

        return [chat, ...prev];
      });
    };

    const handleBookingUpdated = async (
      booking
    ) => {
      let updatedChats = [];

      try {
        updatedChats = await getChats();
        setChats(updatedChats);
      } catch (error) {
        console.error(error);
      }

      if (!booking.chat) return;

      const chatId =
        booking.chat._id ?? booking.chat;

      if (
        selectedChatIdRef.current?.toString() !==
        chatId?.toString()
      ) {
        return;
      }

      if (booking.status === "accepted") {
        const matched = updatedChats.find(
          (chat) =>
            chat._id?.toString() ===
            chatId?.toString()
        );

        if (matched) {
          setSelectedChat(matched);
        }

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
            : null
        );
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("chatAdded", handleChatAdded);
    socket.on(
      "bookingUpdated",
      handleBookingUpdated
    );

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("chatAdded", handleChatAdded);
      socket.off(
        "bookingUpdated",
        handleBookingUpdated
      );
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!messagingEnabled) return;

    const trimmed = content.trim();

    if (!trimmed || !selectedChat) return;

    try {
      const message = await sendMessage(
        selectedChat._id,
        trimmed
      );

      setMessages((prev) => [...prev, message]);
      setContent("");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not send message"
      );
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <p>Loading chats...</p>
      </div>
    );
  }

  const otherUser = selectedChat
    ? getOtherUser(selectedChat)
    : null;

  return (
    <div className="chat-page">
      <aside className="chat-list">
        <h2>Conversations</h2>

        {chats.length === 0 ? (
          <p className="chat-empty">
            Accept a job to start chatting.
          </p>
        ) : (
          chats.map((chat) => {
            const customer = getOtherUser(chat);

            return (
              <button
                key={chat._id}
                type="button"
                className={`chat-item ${
                  selectedChat?._id === chat._id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedChat(chat)
                }
              >
                {customer?.username ||
                  "Customer"}
              </button>
            );
          })
        )}
      </aside>

      <section className="chat-panel">
        {!selectedChat ? (
          <div className="chat-placeholder">
            Select a conversation
          </div>
        ) : (
          <>
            <header className="chat-panel-header">
              {otherUser?.username || "Customer"}
            </header>

            <div className="chat-messages">
              {displayedMessages.map((message) => {
                const isSent =
                  message.sender?._id?.toString() ===
                  user._id?.toString();

                return (
                  <div
                    key={message._id}
                    className={`chat-message ${
                      isSent ? "sent" : "received"
                    }`}
                  >
                    {message.content}
                  </div>
                );
              })}
            </div>

            {!messagingEnabled && (
              <div className="chat-closed-banner">
                <p>
                  This job is complete. The customer
                  must rebook to continue chatting.
                </p>
              </div>
            )}

            {messagingEnabled && (
              <form
                className="chat-input-row"
                onSubmit={handleSend}
              >
                <input
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                  placeholder="Type a message..."
                />
                <button type="submit">Send</button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Chat;
