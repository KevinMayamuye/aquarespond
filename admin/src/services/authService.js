import api from "./api.js";

export const loginAdmin = async (data) => {
  const response = await api.post(
    "/auth/login",
    {
      ...data,
      expectedRole: "admin",
    }
  );

  return response.data;
};
