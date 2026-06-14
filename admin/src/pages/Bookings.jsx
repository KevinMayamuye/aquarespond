import { useEffect, useState } from "react";

import { getAdminBookings } from "../services/adminService";

import "../styles/dashboard.css";

const statusLabel = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] =
    useState("");
  const [loading, setLoading] = useState(true);

  const loadBookings = async (
    status = statusFilter
  ) => {
    try {
      const data = await getAdminBookings(
        status || undefined
      );

      setBookings(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getAdminBookings()
      .then((data) => {
        if (!cancelled) {
          setBookings(data);
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

  const handleFilterChange = async (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setLoading(true);

    await loadBookings(value);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Bookings</h1>
        <p>
          Monitor all bookings across the
          platform.
        </p>
      </header>

      <div className="filter-row">
        <select
          value={statusFilter}
          onChange={handleFilterChange}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">
            Accepted
          </option>
          <option value="completed">
            Completed
          </option>
          <option value="cancelled">
            Cancelled
          </option>
          <option value="declined">
            Declined
          </option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <p className="empty-state">
          No bookings found.
        </p>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking._id}
            className="data-card"
          >
            <div className="data-card-top">
              <strong>
                {booking.serviceType}
              </strong>
              <span
                className={`status-badge status-${booking.status}`}
              >
                {statusLabel[booking.status] ||
                  booking.status}
              </span>
            </div>

            <p>{booking.address}</p>

            <p className="card-meta">
              Customer:{" "}
              {booking.customer?.username ||
                "Unknown"}
              {" · "}
              Plumber:{" "}
              {booking.plumber?.username ||
                "Unknown"}
              {" · "}
              {new Date(
                booking.scheduledAt
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default Bookings;
