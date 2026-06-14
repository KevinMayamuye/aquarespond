import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

import express from "express";
import cors from "cors";

import http from "http";
import { Server } from "socket.io";

import { initSocket } from "./socket/socketManager.js";
import socketAuth from "./socket/socketAuth.js";
import {
  setUserOnline,
  setUserOffline,
} from "./socket/userStatus.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";

import { notifyChatParticipants } from "./socket/chatNotify.js";

import Chat from "./models/Chat.js";

import { FRONTEND_URL, PORT } from "./config/env.js";

const allowedOrigins = FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  if (/^http:\/\/localhost:\d+$/.test(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
};

const isChatParticipant = (chat, userId) =>
  chat.participants.some(
    (id) => id.toString() === userId.toString()
  );

const userSockets = new Map();

const addUserSocket = (userId, socketId) => {
  const key = userId.toString();
  const sockets =
    userSockets.get(key) ?? new Set();

  sockets.add(socketId);
  userSockets.set(key, sockets);

  return sockets.size;
};

const removeUserSocket = (userId, socketId) => {
  const key = userId.toString();
  const sockets = userSockets.get(key);

  if (!sockets) {
    return 0;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(key);
    return 0;
  }

  return sockets.size;
};

const app = express();

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ratings", ratingRoutes);

app.get("/", (req, res) => {
  res.send("server is running");
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

// Make io available throughout the app
initSocket(io);

io.use(socketAuth);

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.data.userId;

  socket.join(userId);

  const connectionCount = addUserSocket(
    userId,
    socket.id
  );

  if (connectionCount === 1) {
    await setUserOnline(userId);
  }

  console.log(
    `User ${userId} joined room`
  );

  socket.emit("connected");

  socket.on("typing", async ({ chatId, isTyping }) => {
    if (!chatId) {
      return;
    }

    try {
      const chat = await Chat.findById(chatId);

      if (
        !chat ||
        !isChatParticipant(
          chat,
          userId
        )
      ) {
        return;
      }

      notifyChatParticipants(
        chat,
        userId,
        "userTyping",
        {
          chatId: chatId.toString(),
          userId,
          isTyping: Boolean(isTyping),
        }
      );
    } catch (error) {
      console.error("Typing relay failed:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    const remaining = removeUserSocket(
      userId,
      socket.id
    );

    if (remaining === 0) {
      await setUserOffline(userId);
    }
  });
});

// Connect Database, then start server
const startServer = async () => {
  validateEnv();
  await connectDB();

  server.listen(PORT, () => {
    console.log(
      `Server is running on port ${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
