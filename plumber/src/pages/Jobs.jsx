import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  acceptBooking,
  declineBooking,
  completeBooking,
  getActiveBookings,
  getIncomingBookings,
} from "../services/bookingService";

import { socket } from "../socket/socket";

import "../styles/jobs.css";

const Jobs = () => {
  const navigate = useNavigate();

  const [incoming, setIncoming] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getIncomingBookings(),
      getActiveBookings(),
    ])
      .then(([incomingData, activeData]) => {
        if (cancelled) return;

        setIncoming(incomingData);
        setActive(activeData);
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

  const loadJobs = async () => {
    const [incomingData, activeData] =
      await Promise.all([
        getIncomingBookings(),
        getActiveBookings(),
      ]);

    setIncoming(incomingData);
    setActive(activeData);
  };

  useEffect(() => {
    const refresh = () => {
      loadJobs();
    };

    socket.on("bookingRequested", refresh);
    socket.on("bookingUpdated", refresh);

    return () => {
      socket.off("bookingRequested", refresh);
      socket.off("bookingUpdated", refresh);
    };
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptBooking(id);
      await loadJobs();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not accept booking"
      );
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineBooking(id);
      await loadJobs();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not decline booking"
      );
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeBooking(id);
      await loadJobs();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not complete booking"
      );
    }
  };

  const openChat = () => {
    navigate("/dashboard/chat");
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <h1>Job requests</h1>
        <p>
          Accept bookings to unlock chat with
          customers.
        </p>
      </header>

      <section className="jobs-section">
        <h2>Incoming requests</h2>

        {incoming.length === 0 ? (
          <p className="jobs-empty">
            No pending requests.
          </p>
        ) : (
          incoming.map((booking) => (
            <div
              key={booking._id}
              className="job-card"
            >
              <strong>
                {booking.customer?.username}
              </strong>
              <p>{booking.serviceType}</p>
              <p>{booking.address}</p>
              <p>
                {new Date(
                  booking.scheduledAt
                ).toLocaleString()}
              </p>

              <div className="job-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleAccept(booking._id)
                  }
                >
                  Accept
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    handleDecline(booking._id)
                  }
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="jobs-section">
        <h2>Active jobs</h2>

        {active.length === 0 ? (
          <p className="jobs-empty">
            No active jobs.
          </p>
        ) : (
          active.map((booking) => (
            <div
              key={booking._id}
              className="job-card"
            >
              <strong>
                {booking.customer?.username}
              </strong>
              <p>{booking.serviceType}</p>
              <p>{booking.address}</p>
              <p>
                {new Date(
                  booking.scheduledAt
                ).toLocaleString()}
              </p>

              <div className="job-actions">
                <button
                  type="button"
                  onClick={openChat}
                >
                  Message customer
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    handleComplete(booking._id)
                  }
                >
                  Mark complete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default Jobs;
