import api from "./api.js";

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");

  return response.data;
};

export const getAdminWaterWasteReports = async (
  status
) => {
  const response = await api.get(
    "/admin/reports/water-waste",
    {
      params: status ? { status } : undefined,
    }
  );

  return response.data;
};

export const getAvailablePlumbers = async () => {
  const response = await api.get(
    "/admin/plumbers/available"
  );

  return response.data;
};

export const updateAdminWaterWasteReport = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/admin/reports/water-waste/${id}`,
    payload
  );

  return response.data;
};

export const getAdminUsers = async (role) => {
  const response = await api.get("/admin/users", {
    params: role ? { role } : undefined,
  });

  return response.data;
};

export const updateAdminUser = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/admin/users/${id}`,
    payload
  );

  return response.data;
};

export const getAdminBookings = async (status) => {
  const response = await api.get(
    "/admin/bookings",
    {
      params: status ? { status } : undefined,
    }
  );

  return response.data;
};
