import api from "./api.js";

export const registerUser = async (userData) => {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
};

export const loginUser = async (userData) => {
  const response = await api.post(
    "/auth/login",
    {
      ...userData,
      expectedRole: "customer",
    }
  );

  return response.data;
};
