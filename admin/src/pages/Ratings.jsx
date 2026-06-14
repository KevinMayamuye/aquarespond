import { useCallback, useEffect, useState } from "react";

import {
  getAdminRatings,
  updateAdminRating,
} from "../services/adminService";

import { socket } from "../socket/socket";

import "../styles/dashboard.css";

const statusLabel = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const formatDate = (value) =>
  new Date(value).toLocaleString();

const renderStars = (score) =>
  "★".repeat(score) + "☆".repeat(5 - score);

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [statusFilter, setStatusFilter] =
    useState("pending");
  const [loading, setLoading] = useState(true);

  const loadRatings = useCallback(async (status) => {
    try {
      const data = await getAdminRatings(
        status || undefined
      );

      setRatings(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAdminRatings("pending")
      .then((data) => {
        if (!cancelled) {
          setRatings(data);
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
    const refresh = () => {
      loadRatings(statusFilter);
    };

    socket.on("ratingSubmitted", refresh);
    socket.on("ratingUpdated", refresh);

    return () => {
      socket.off("ratingSubmitted", refresh);
      socket.off("ratingUpdated", refresh);
    };
  }, [loadRatings, statusFilter]);

  const handleFilterChange = async (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setLoading(true);

    await loadRatings(value);
    setLoading(false);
  };

  const handleUpdate = async (id, status) => {
    try {
      const updated = await updateAdminRating(
        id,
        { status }
      );

      setRatings((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );

      if (
        statusFilter &&
        statusFilter !== updated.status
      ) {
        setRatings((prev) =>
          prev.filter((item) => item._id !== id)
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not update rating"
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading ratings...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Ratings</h1>
        <p>
          Review customer ratings before they appear
          on plumber profiles.
        </p>
      </header>

      <div className="filter-row">
        <label htmlFor="ratings-status-filter">
          Status
        </label>
        <select
          id="ratings-status-filter"
          name="statusFilter"
          value={statusFilter}
          onChange={handleFilterChange}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {ratings.length === 0 ? (
        <p className="empty-state">
          No ratings found.
        </p>
      ) : (
        ratings.map((rating) => (
          <div
            key={rating._id}
            className="data-card"
          >
            <div className="data-card-top">
              <strong>
                {rating.plumber?.username ||
                  "Plumber"}
              </strong>
              <span
                className={`status-badge status-${rating.status}`}
              >
                {statusLabel[rating.status] ||
                  rating.status}
              </span>
            </div>

            <p>
              Customer:{" "}
              {rating.customer?.username || "—"}
            </p>
            <p className="rating-stars">
              {renderStars(rating.score)}
            </p>
            {rating.comment && (
              <p>{rating.comment}</p>
            )}
            <p className="card-meta">
              Booking:{" "}
              {rating.booking?.serviceType || "—"} ·{" "}
              {rating.booking?.scheduledAt
                ? formatDate(
                    rating.booking.scheduledAt
                  )
                : "—"}
            </p>
            <p className="card-meta">
              Submitted:{" "}
              {formatDate(rating.createdAt)}
            </p>

            {rating.status === "pending" && (
                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(
                        rating._id,
                        "approved"
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      handleUpdate(
                        rating._id,
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Ratings;
