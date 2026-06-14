import { findOrCreateDirectChat } from "./findOrCreateDirectChat.js";
import { getSupportAdmin } from "./supportAdmin.js";

export const ensureSupportChat = async (userId) => {
  const supportAdmin = await getSupportAdmin();

  if (!supportAdmin) {
    throw new Error("No support admin configured");
  }

  const { chat } = await findOrCreateDirectChat(
    userId,
    supportAdmin._id
  );

  return chat;
};
