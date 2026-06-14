import api from "./api.js";

export const getMessages = async (
  chatId,
  { before } = {}
) => {
  const params = {};

  if (before) {
    params.before = before;
  }

  const response = await api.get(
    `/messages/${chatId}`,
    { params }
  );

  const { messages = [], hasMore = false } =
    response.data ?? {};

  return { messages, hasMore };
};

export const sendMessage = async (
  chatId,
  content
) => {
  const response = await api.post("/messages", {
    chatId,
    content,
  });

  return response.data;
};

export const markChatAsRead = async (chatId) => {
  await api.put(`/messages/read/${chatId}`);
};
