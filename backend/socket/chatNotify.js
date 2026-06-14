import { getIO } from "./socketManager.js";

export const notifyChatParticipants = (
  chat,
  senderId,
  event,
  payload
) => {
  const io = getIO();

  chat.participants
    .filter(
      (id) =>
        id.toString() !== senderId.toString()
    )
    .forEach((id) => {
      io.to(id.toString()).emit(event, payload);
    });
};