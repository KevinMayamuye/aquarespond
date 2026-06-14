import api from "./api.js";

export const submitWaterWasteReport = async (
  payload
) => {
  const response = await api.post(
    "/reports/water-waste",
    payload
  );

  return response.data;
};

export const getMyWaterWasteReports = async () => {
  const response = await api.get(
    "/reports/water-waste/mine"
  );

  return response.data;
};
