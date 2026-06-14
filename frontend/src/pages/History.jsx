import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getBookingHistory } from "../services/bookingService";

import { socket } from "../socket/socket";

import BookingList from "../components/BookingList";
import RatingModal from "../components/RatingModal";

import "../styles/book.css";

const History = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingBooking, setRatingBooking] =
    useState(null);

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

  const handleRebook = (booking) => {
    navigate("/dashboard/book", {
      state: {
        rebookFrom: {
          rebookBookingId: booking._id,
        },
      },
    });
  };

  const handleRatingSubmitted = async () => {
    await loadHistory();
  };

  if (loading) {
    return (
      <div className="book-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="book-page">
      <header className="book-header">
        <h1>Booking history</h1>
        <p>
          Completed, cancelled, and declined
          bookings appear here.
        </p>
      </header>

      <section className="book-section book-section-wide">
        <BookingList
          bookings={bookings}
          variant="history"
          onRebook={handleRebook}
          onRate={setRatingBooking}
        />
      </section>

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

export default History;
