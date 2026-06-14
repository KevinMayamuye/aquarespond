import api from "./api.js";

export const getIncomingBookings = async () => {
  const response = await api.get(
    "/bookings/incoming"
  );

  return response.data;
};

export const getActiveBookings = async () => {
  const response = await api.get(
    "/bookings/active"
  );

  return response.data;
};

export const getBookingHistory = async () => {
  const response = await api.get(
    "/bookings/history"
  );

  return response.data;
};

export const acceptBooking = async (id) => {
  const response = await api.put(
    `/bookings/${id}/accept`
  );

  return response.data;
};

export const declineBooking = async (id) => {
  const response = await api.put(
    `/bookings/${id}/decline`
  );

  return response.data;
};

export const completeBooking = async (id) => {
  const response = await api.put(
    `/bookings/${id}/complete`
  );

  return response.data;
};
