import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import {
  getBookingHistory,
  getMyBookings,
} from "../services/bookingService";

import { socket } from "../socket/socket";

import BookingList from "../components/BookingList";
import RatingModal from "../components/RatingModal";

import "../styles/home.css";
import "../styles/book.css";

const filterPendingRatings = (bookings) =>
  bookings.filter(
    (booking) =>
      booking.status === "completed" &&
      !booking.customerRating
  );

const Home = () => {
  const { user } = useAuth();
  const [activeCount, setActiveCount] =
    useState(null);
  const [pendingRatingBookings, setPendingRatingBookings] =
    useState([]);
  const [ratingBooking, setRatingBooking] =
    useState(null);

  const loadPendingRatings = async () => {
    try {
      const data = await getBookingHistory();
      setPendingRatingBookings(
        filterPendingRatings(data)
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyBookings(),
      getBookingHistory(),
    ])
      .then(([bookings, history]) => {
        if (cancelled) return;

        const count = bookings.filter(
          (booking) =>
            booking.status === "pending" ||
            booking.status === "accepted"
        ).length;

        setActiveCount(count);
        setPendingRatingBookings(
          filterPendingRatings(history)
        );
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleBookingUpdated = (booking) => {
      if (booking.status === "completed") {
        loadPendingRatings();
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

  const handleRatingSubmitted = async () => {
    await loadPendingRatings();
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>
          Welcome
          {user?.username
            ? `, ${user.username}`
            : ""}
        </h1>
        <p>What would you like to do?</p>
      </header>

      {pendingRatingBookings.length > 0 && (
        <section className="home-ratings">
          <h2>Rate your plumber</h2>
          <p>
            You have completed{" "}
            {pendingRatingBookings.length === 1
              ? "a job"
              : "jobs"}{" "}
            waiting for your feedback.
          </p>
          <BookingList
            bookings={pendingRatingBookings}
            variant="rating-prompt"
            onRate={setRatingBooking}
          />
        </section>
      )}

      <div className="home-actions">
        <Link
          to="/dashboard/book"
          className="home-cta home-cta-book"
        >
          <strong>Book a plumber</strong>
          <span>
            Find an available plumber and schedule
            a service visit.
          </span>
        </Link>

        <Link
          to="/dashboard/report"
          className="home-cta home-cta-report"
        >
          <strong>Report water waste</strong>
          <span>
            Report leaks, burst pipes, or illegal
            water connections in your area.
          </span>
        </Link>
      </div>

      {activeCount !== null && activeCount > 0 && (
        <section className="home-summary">
          <h2>Active bookings</h2>
          <p>
            You have {activeCount} active{" "}
            {activeCount === 1
              ? "booking"
              : "bookings"}
            .
          </p>
          <Link to="/dashboard/history">
            View booking history
          </Link>
        </section>
      )}

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
};

export default Home;
