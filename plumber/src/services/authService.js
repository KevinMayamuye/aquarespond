import api from "./api.js";

export const registerPlumber = async (data) => {
  const response = await api.post(
    "/auth/register/plumber",
    data
  );

  return response.data;
};

export const loginPlumber = async (data) => {
  const response = await api.post(
    "/auth/login",
    {
      ...data,
      expectedRole: "plumber",
    }
  );

  return response.data;
};
