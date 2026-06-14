import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getAdminStats } from "../services/adminService";
import { getChats } from "../services/chatService";
import { socket } from "../socket/socket";

const NotificationContext = createContext(null);

const ROUTE_CLEAR_MAP = [
  {
    prefix: "/dashboard/reports",
    key: "reports",
  },
  {
    prefix: "/dashboard/users",
    key: "users",
  },
  {
    prefix: "/dashboard/bookings",
    key: "bookings",
  },
  {
    prefix: "/dashboard/ratings",
    key: "ratings",
  },
  {
    prefix: "/dashboard/chat",
    key: "chat",
  },
];

const isOverviewRoute = (pathname) =>
  pathname === "/dashboard" ||
  pathname === "/dashboard/";

const keysToClearForPath = (pathname) => {
  const keys = ROUTE_CLEAR_MAP.filter(({ prefix }) =>
    pathname.startsWith(prefix)
  ).map(({ key }) => key);

  if (isOverviewRoute(pathname)) {
    keys.push("overview");
  }

  return keys;
};

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
    (key) => {
      if (key === "overview") {
        return isOverviewRoute(
          location.pathname
        );
      }

      const prefixes = {
        reports: "/dashboard/reports",
        users: "/dashboard/users",
        bookings: "/dashboard/bookings",
        ratings: "/dashboard/ratings",
        chat: "/dashboard/chat",
      };

      return location.pathname.startsWith(
        prefixes[key]
      );
    },
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

    const markOverview = () => markDot("overview");

    const handleWaterWasteReported = () => {
      markDot("reports");
      markOverview();
    };

    const handleWaterWasteReportUpdated = () => {
      markDot("reports");
      markOverview();
    };

    const handleBookingActivity = () => {
      markDot("bookings");
      markOverview();
    };

    const handleUserRegistered = () => {
      markDot("users");
      markOverview();
    };

    const handleRatingSubmitted = () => {
      markDot("ratings");
      markOverview();
    };

    const handleNewMessage = (message) => {
      const senderId =
        message.sender?._id?.toString() ??
        message.sender?.toString();

      if (
        senderId !== user._id?.toString()
      ) {
        markDot("chat");
        markOverview();
      }
    };

    const handleChatAdded = () => {
      markDot("chat");
      markOverview();
    };

    getAdminStats()
      .then((stats) => {
        if ((stats?.pendingReports ?? 0) > 0) {
          markDot("reports");
          markOverview();
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
          markOverview();
        }
      })
      .catch(console.error);

    socket.on(
      "waterWasteReported",
      handleWaterWasteReported
    );
    socket.on(
      "waterWasteReportUpdated",
      handleWaterWasteReportUpdated
    );
    socket.on(
      "bookingActivity",
      handleBookingActivity
    );
    socket.on(
      "userRegistered",
      handleUserRegistered
    );
    socket.on(
      "ratingSubmitted",
      handleRatingSubmitted
    );
    socket.on("newMessage", handleNewMessage);
    socket.on("chatAdded", handleChatAdded);

    return () => {
      socket.off(
        "waterWasteReported",
        handleWaterWasteReported
      );
      socket.off(
        "waterWasteReportUpdated",
        handleWaterWasteReportUpdated
      );
      socket.off(
        "bookingActivity",
        handleBookingActivity
      );
      socket.off(
        "userRegistered",
        handleUserRegistered
      );
      socket.off(
        "ratingSubmitted",
        handleRatingSubmitted
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
