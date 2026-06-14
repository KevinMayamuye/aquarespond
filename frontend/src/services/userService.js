import api from "./api.js";

export const searchUsers = async (username) => {
  const response = await api.get(
    "/users/search",
    {
      params: { username },
    }
  );

  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get("/users/me");

  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);

  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.put("/users/me", data);

  return response.data;
};
