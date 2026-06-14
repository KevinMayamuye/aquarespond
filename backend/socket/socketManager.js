let io = null;

export const initSocket = (serverIo) => {
  io = serverIo;
};

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
};