import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getIncomingBookings } from "../services/bookingService";
import { getChats } from "../services/chatService";
import { socket } from "../socket/socket";

const NotificationContext = createContext(null);

const CLOSED_BOOKING_STATUSES = [
  "completed",
  "declined",
  "cancelled",
];

const FEATURE_ROUTES = {
  jobs: "/dashboard/jobs",
  reports: "/dashboard/reports",
  history: "/dashboard/history",
  chat: "/dashboard/chat",
};

const ROUTE_CLEAR_MAP = [
  { prefix: "/dashboard/jobs", key: "jobs" },
  {
    prefix: "/dashboard/reports",
    key: "reports",
  },
  {
    prefix: "/dashboard/history",
    key: "history",
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

    const handleBookingRequested = () => {
      markDot("jobs");
    };

    const handleBookingUpdated = (booking) => {
      markDot("jobs");

      if (
        CLOSED_BOOKING_STATUSES.includes(
          booking.status
        )
      ) {
        markDot("history");
      }
    };

    const handleReportAssigned = () => {
      markDot("reports");
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

    getIncomingBookings()
      .then((bookings) => {
        if (bookings.length > 0) {
          markDot("jobs");
        }
      })
      .catch(console.error);

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
      "bookingRequested",
      handleBookingRequested
    );
    socket.on(
      "bookingUpdated",
      handleBookingUpdated
    );
    socket.on(
      "reportAssigned",
      handleReportAssigned
    );
    socket.on("newMessage", handleNewMessage);
    socket.on("chatAdded", handleChatAdded);

    return () => {
      socket.off(
        "bookingRequested",
        handleBookingRequested
      );
      socket.off(
        "bookingUpdated",
        handleBookingUpdated
      );
      socket.off(
        "reportAssigned",
        handleReportAssigned
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
