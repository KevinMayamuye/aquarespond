const statusLabel = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

const formatDate = (value) =>
  new Date(value).toLocaleString();

const BookingList = ({
  bookings,
  onCancel,
  onMessage,
  onRebook,
  variant = "active",
}) => {
  const isHistory = variant === "history";

  if (bookings.length === 0) {
    return (
      <p className="book-empty">
        {isHistory
          ? "No booking history yet."
          : "No bookings yet."}
      </p>
    );
  }

  return (
    <div className="booking-list">
      {bookings.map((booking) => (
        <div
          key={booking._id}
          className="booking-card"
        >
          <div className="booking-card-top">
            <strong>
              {booking.plumber?.username ||
                "Plumber"}
            </strong>
            <span
              className={`booking-status status-${booking.status}`}
            >
              {statusLabel[booking.status] ||
                booking.status}
            </span>
          </div>

          <p>{booking.serviceType}</p>
          <p>{booking.address}</p>
          <p className="booking-time">
            {formatDate(booking.scheduledAt)}
          </p>

          {!isHistory && (
            <div className="booking-actions">
              {booking.status === "accepted" &&
                booking.chat && (
                  <button
                    type="button"
                    className="booking-message-btn"
                    onClick={() =>
                      onMessage(booking)
                    }
                  >
                    Message plumber
                  </button>
                )}

              {booking.status === "completed" && (
                <button
                  type="button"
                  className="booking-rebook-btn"
                  onClick={() =>
                    onRebook(booking)
                  }
                >
                  Rebook
                </button>
              )}

              {booking.status === "pending" && (
                <button
                  type="button"
                  className="booking-cancel-btn"
                  onClick={() =>
                    onCancel(booking._id)
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {isHistory &&
            booking.status === "completed" &&
            onRebook && (
              <div className="booking-actions">
                <button
                  type="button"
                  className="booking-rebook-btn"
                  onClick={() =>
                    onRebook(booking)
                  }
                >
                  Rebook
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default BookingList;
