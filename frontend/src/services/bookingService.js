import api from "./api.js";

export const createBooking = async (payload) => {
  const response = await api.post(
    "/bookings",
    payload
  );

  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get(
    "/bookings/mine"
  );

  return response.data;
};

export const getBookingHistory = async () => {
  const response = await api.get(
    "/bookings/history"
  );

  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.put(
    `/bookings/${bookingId}/cancel`
  );

  return response.data;
};
