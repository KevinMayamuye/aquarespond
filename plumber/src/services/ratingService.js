import api from "./api.js";

export const getMyRatingSummary = async () => {
  const response = await api.get(
    "/ratings/me/summary"
  );

  return response.data;
};
