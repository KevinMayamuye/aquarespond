import api from "./api.js";

export const getMyAssignedReports = async () => {
  const response = await api.get(
    "/reports/assignments/mine"
  );

  return response.data;
};

export const updateAssignedReportStatus = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/reports/assignments/${id}`,
    payload
  );

  return response.data;
};
