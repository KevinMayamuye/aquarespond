import { useEffect, useState } from "react";

import { getBookingHistory } from "../services/bookingService";

import { socket } from "../socket/socket";

import "../styles/jobs.css";

const statusLabel = {
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

const History = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await getBookingHistory();
      setBookings(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getBookingHistory()
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

  useEffect(() => {
    const handleBookingUpdated = (booking) => {
      if (
        ["completed", "cancelled", "declined"].includes(
          booking.status
        )
      ) {
        loadHistory();
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
  }, []);

  if (loading) {
    return (
      <div className="jobs-page">
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <h1>Job history</h1>
        <p>
          Completed, cancelled, and declined jobs
          appear here.
        </p>
      </header>

      {bookings.length === 0 ? (
        <p className="jobs-empty">
          No job history yet.
        </p>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking._id}
            className="job-card"
          >
            <div className="job-card-top">
              <strong>
                {booking.customer?.username ||
                  "Customer"}
              </strong>
              <span
                className={`job-status status-${booking.status}`}
              >
                {statusLabel[booking.status] ||
                  booking.status}
              </span>
            </div>

            <p>{booking.serviceType}</p>
            <p>{booking.address}</p>
            <p>
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

export default History;
