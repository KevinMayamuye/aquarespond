import api from "./api.js";

export const getChats = async () => {
  const response = await api.get("/chats");

  return response.data;
};
