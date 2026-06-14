import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getActiveBookings,
  getBookingHistory,
  getIncomingBookings,
} from "../services/bookingService";
import { getChats } from "../services/chatService";
import { getMyAssignedReports } from "../services/reportService";
import { getMyRatingSummary } from "../services/ratingService";

import { socket } from "../socket/socket";

import "../styles/dashboard.css";

const formatDate = (value) =>
  new Date(value).toLocaleString();

const buildOverviewState = (
  incoming,
  active,
  reports,
  chats,
  ratings,
  history
) => {
  const unreadMessages = chats.reduce(
    (sum, chat) => sum + (chat.unreadCount ?? 0),
    0
  );

  const completedJobs = history.filter(
    (booking) => booking.status === "completed"
  ).length;

  const stats = {
    incomingCount: incoming.length,
    activeCount: active.length,
    reportsCount: reports.length,
    unreadMessages,
    averageRating: ratings.averageRating,
    ratingCount: ratings.ratingCount ?? 0,
    completedJobs,
  };

  let nextJob = null;

  if (active.length > 0) {
    const sorted = [...active].sort(
      (a, b) =>
        new Date(a.scheduledAt) -
        new Date(b.scheduledAt)
    );

    nextJob = sorted[0];
  }

  return { stats, nextJob };
};

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [nextJob, setNextJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getIncomingBookings(),
      getActiveBookings(),
      getMyAssignedReports(),
      getChats(),
      getMyRatingSummary(),
      getBookingHistory(),
    ])
      .then(
        ([
          incoming,
          active,
          reports,
          chats,
          ratings,
          history,
        ]) => {
          if (cancelled) return;

          const overview = buildOverviewState(
            incoming,
            active,
            reports,
            chats,
            ratings,
            history
          );

          setStats(overview.stats);
          setNextJob(overview.nextJob);
        }
      )
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
    const refresh = () => {
      Promise.all([
        getIncomingBookings(),
        getActiveBookings(),
        getMyAssignedReports(),
        getChats(),
        getMyRatingSummary(),
        getBookingHistory(),
      ])
        .then(
          ([
            incoming,
            active,
            reports,
            chats,
            ratings,
            history,
          ]) => {
            const overview = buildOverviewState(
              incoming,
              active,
              reports,
              chats,
              ratings,
              history
            );

            setStats(overview.stats);
            setNextJob(overview.nextJob);
          }
        )
        .catch(console.error);
    };

    socket.on("bookingRequested", refresh);
    socket.on("bookingUpdated", refresh);
    socket.on("reportAssigned", refresh);
    socket.on("newMessage", refresh);

    return () => {
      socket.off("bookingRequested", refresh);
      socket.off("bookingUpdated", refresh);
      socket.off("reportAssigned", refresh);
      socket.off("newMessage", refresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p>
          Your bookings, reports, and activity at
          a glance.
        </p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>
            {stats?.incomingCount ?? 0}
          </strong>
          <span>Incoming requests</span>
        </div>

        <div className="stat-card">
          <strong>{stats?.activeCount ?? 0}</strong>
          <span>Active jobs</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.reportsCount ?? 0}
          </strong>
          <span>Open report assignments</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.unreadMessages ?? 0}
          </strong>
          <span>Unread messages</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.ratingCount > 0
              ? stats.averageRating?.toFixed(1)
              : "—"}
          </strong>
          <span>
            Average rating
            {stats?.ratingCount > 0
              ? ` (${stats.ratingCount} reviews)`
              : ""}
          </span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.completedJobs ?? 0}
          </strong>
          <span>Completed jobs</span>
        </div>
      </div>

      {nextJob && (
        <section className="dashboard-section">
          <h2>Next upcoming job</h2>
          <div className="next-job-card">
            <p>
              <strong>
                {nextJob.customer?.username ||
                  "Customer"}
              </strong>
            </p>
            <p>{nextJob.serviceType}</p>
            <p>{nextJob.address}</p>
            <p className="next-job-time">
              {formatDate(nextJob.scheduledAt)}
            </p>
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <h2>Quick actions</h2>
        <div className="dashboard-actions">
          <Link
            to="/dashboard/jobs"
            className="dashboard-link-btn"
          >
            View jobs
          </Link>
          <Link
            to="/dashboard/reports"
            className="dashboard-link-btn"
          >
            View reports
          </Link>
          <Link
            to="/dashboard/chat"
            className="dashboard-link-btn"
          >
            Open chat
          </Link>
          <Link
            to="/dashboard/history"
            className="dashboard-link-btn"
          >
            Job history
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Overview;
