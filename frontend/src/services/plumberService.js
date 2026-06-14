import api from "./api.js";

export const getPlumbers = async () => {
  const response = await api.get(
    "/bookings/plumbers"
  );

  return response.data;
};

export const getPlumberById = async (id) => {
  const response = await api.get(
    `/bookings/plumbers/${id}`
  );

  return response.data;
};
