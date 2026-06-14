import api from "./api.js";

export const submitBookingRating = async (
  bookingId,
  payload
) => {
  const response = await api.post(
    `/bookings/${bookingId}/rating`,
    payload
  );

  return response.data;
};

export const getBookingRating = async (
  bookingId
) => {
  const response = await api.get(
    `/bookings/${bookingId}/rating`
  );

  return response.data;
};
