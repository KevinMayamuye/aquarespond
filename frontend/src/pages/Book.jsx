import { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useChat } from "../hooks/useChat";
import { getPlumbers } from "../services/plumberService";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../services/bookingService";
import { getChats } from "../services/chatService";

import { socket } from "../socket/socket";

import PlumberPicker from "../components/PlumberPicker";
import BookingForm from "../components/BookingForm";
import BookingList from "../components/BookingList";

import "../styles/book.css";

const Book = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedChat } = useChat();
  const formRef = useRef(null);

  const [plumbers, setPlumbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedPlumber, setSelectedPlumber] =
    useState(null);
  const [formInitialValues, setFormInitialValues] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const applyRebook = (booking) => {
    if (!booking?.plumber) return;

    setSelectedPlumber(booking.plumber);
    setFormInitialValues({
      serviceType: booking.serviceType || "",
      address: booking.address || "",
      notes: booking.notes || "",
    });

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPlumbers(),
      getMyBookings(),
    ])
      .then(([plumberData, bookingData]) => {
        if (cancelled) return;

        setPlumbers(plumberData);
        setBookings(bookingData);

        const rebookState = location.state?.rebookFrom;

        if (rebookState?.plumber) {
          setSelectedPlumber(rebookState.plumber);

          requestAnimationFrame(() => {
            formRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        } else if (rebookState?.rebookBookingId) {
          const source = bookingData.find(
            (item) =>
              item._id?.toString() ===
              rebookState.rebookBookingId?.toString()
          );

          if (source) {
            applyRebook(source);
          }
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
  }, [location.state]);

  useEffect(() => {
    const handleBookingUpdated = (booking) => {
      setBookings((prev) => {
        const exists = prev.some(
          (item) =>
            item._id?.toString() ===
            booking._id?.toString()
        );

        if (exists) {
          return prev.map((item) =>
            item._id?.toString() ===
            booking._id?.toString()
              ? booking
              : item
          );
        }

        return [booking, ...prev];
      });
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

  const handleCreateBooking = async (
    payload
  ) => {
    setSubmitting(true);

    try {
      const booking = await createBooking(
        payload
      );

      setBookings((prev) => [booking, ...prev]);
      setSelectedPlumber(null);
      setFormInitialValues(null);
      alert(
        "Booking requested! You'll be able to chat once the plumber accepts."
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not create booking"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const updated = await cancelBooking(
        bookingId
      );

      setBookings((prev) =>
        prev.map((item) =>
          item._id?.toString() ===
          updated._id?.toString()
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not cancel booking"
      );
    }
  };

  const handleMessage = async (booking) => {
    if (!booking.chat) return;

    try {
      const chats = await getChats();
      const chatId =
        booking.chat._id ?? booking.chat;
      const matched = chats.find(
        (chat) =>
          chat._id?.toString() ===
          chatId?.toString()
      );

      if (matched) {
        setSelectedChat(matched);
      } else if (
        typeof booking.chat === "object"
      ) {
        setSelectedChat(booking.chat);
      }

      navigate("/dashboard/chat");
    } catch (error) {
      console.error(error);
      alert("Could not open chat");
    }
  };

  const handleRebook = (booking) => {
    applyRebook(booking);
  };

  const activeBookings = bookings.filter(
    (booking) =>
      booking.status === "pending" ||
      booking.status === "accepted"
  );

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
        <h1>Book a plumber</h1>
        <p>
          Choose a plumber, pick a time, and
          request a visit. Chat unlocks after
          they accept.
        </p>
      </header>

      <div className="book-layout">
        <section className="book-section">
          <h2>Choose plumber</h2>
          <PlumberPicker
            plumbers={plumbers}
            selectedId={selectedPlumber?._id}
            onSelect={setSelectedPlumber}
          />
        </section>

        <section className="book-section">
          <h2>Booking details</h2>
          <BookingForm
            key={
              selectedPlumber?._id ||
              "no-plumber"
            }
            formRef={formRef}
            selectedPlumber={selectedPlumber}
            initialValues={formInitialValues}
            onSubmit={handleCreateBooking}
            submitting={submitting}
          />
        </section>

        <section className="book-section book-section-wide">
          <h2>Active bookings</h2>
          <BookingList
            bookings={activeBookings}
            onCancel={handleCancel}
            onMessage={handleMessage}
            onRebook={handleRebook}
          />
        </section>
      </div>
    </div>
  );
};

export default Book;
