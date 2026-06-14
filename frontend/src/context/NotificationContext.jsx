import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getChats } from "../services/chatService";
import { socket } from "../socket/socket";

const NotificationContext = createContext(null);

const CLOSED_BOOKING_STATUSES = [
  "completed",
  "declined",
  "cancelled",
];

const FEATURE_ROUTES = {
  book: "/dashboard/book",
  history: "/dashboard/history",
  report: "/dashboard/report",
  chat: "/dashboard/chat",
};

const ROUTE_CLEAR_MAP = [
  { prefix: "/dashboard/book", key: "book" },
  {
    prefix: "/dashboard/history",
    key: "history",
  },
  {
    prefix: "/dashboard/report",
    key: "report",
  },
  { prefix: "/dashboard/chat", key: "chat" },
];

const keysToClearForPath = (pathname) =>
  ROUTE_CLEAR_MAP.filter(({ prefix }) =>
    pathname.startsWith(prefix)
  ).map(({ key }) => key);

export const NotificationProvider = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingDots, setPendingDots] =
    useState({});
  const [trackedPathname, setTrackedPathname] =
    useState(location.pathname);

  if (location.pathname !== trackedPathname) {
    setTrackedPathname(location.pathname);

    const keysToClear = keysToClearForPath(
      location.pathname
    );

    if (keysToClear.length > 0) {
      setPendingDots((prev) => {
        let changed = false;
        const next = { ...prev };

        for (const key of keysToClear) {
          if (next[key]) {
            next[key] = false;
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    }
  }

  const isOnFeature = useCallback(
    (key) =>
      location.pathname.startsWith(
        FEATURE_ROUTES[key]
      ),
    [location.pathname]
  );

  const dots = useMemo(() => {
    if (!user?.token) {
      return {};
    }

    return pendingDots;
  }, [pendingDots, user?.token]);

  const markDot = useCallback(
    (key) => {
      if (!isOnFeature(key)) {
        setPendingDots((prev) => ({
          ...prev,
          [key]: true,
        }));
      }
    },
    [isOnFeature]
  );

  const clearDot = useCallback((key) => {
    setPendingDots((prev) => ({
      ...prev,
      [key]: false,
    }));
  }, []);

  useEffect(() => {
    if (!user?.token) {
      return;
    }

    const userId = user._id?.toString();

    const handleBookingUpdated = (booking) => {
      markDot("book");

      if (
        CLOSED_BOOKING_STATUSES.includes(
          booking.status
        )
      ) {
        markDot("history");
      }
    };

    const handleReportUpdated = () => {
      markDot("report");
    };

    const handleNewMessage = (message) => {
      const senderId =
        message.sender?._id?.toString() ??
        message.sender?.toString();

      if (senderId !== userId) {
        markDot("chat");
      }
    };

    const handleChatAdded = () => {
      markDot("chat");
    };

    getChats()
      .then((chats) => {
        const hasUnread = chats.some(
          (chat) => (chat.unreadCount || 0) > 0
        );

        if (hasUnread) {
          markDot("chat");
        }
      })
      .catch(console.error);

    socket.on(
      "bookingUpdated",
      handleBookingUpdated
    );
    socket.on(
      "waterWasteReportUpdated",
      handleReportUpdated
    );
    socket.on("newMessage", handleNewMessage);
    socket.on("chatAdded", handleChatAdded);

    return () => {
      socket.off(
        "bookingUpdated",
        handleBookingUpdated
      );
      socket.off(
        "waterWasteReportUpdated",
        handleReportUpdated
      );
      socket.off(
        "newMessage",
        handleNewMessage
      );
      socket.off(
        "chatAdded",
        handleChatAdded
      );
    };
  }, [user?.token, user?._id, markDot]);

  return (
    <NotificationContext.Provider
      value={{ dots, markDot, clearDot }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
