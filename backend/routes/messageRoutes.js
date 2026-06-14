import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { uploadSingleFile } from "../middleware/uploadMiddleware.js";

import {
  sendMessage,
  getMessages,
  markChatAsRead,
  markMessageDelivered,
  updateMessage,
  deleteMessage,
  toggleReaction,
} from "../controllers/messageController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadSingleFile,
  sendMessage
);

router.put(
  "/read/:chatId",
  authMiddleware,
  markChatAsRead
);

router.put(
  "/delivered/:messageId",
  authMiddleware,
  markMessageDelivered
);

router.put(
  "/:messageId/reaction",
  authMiddleware,
  toggleReaction
);

router.put(
  "/:messageId",
  authMiddleware,
  updateMessage
);

router.delete(
  "/:messageId",
  authMiddleware,
  deleteMessage
);

router.get(
  "/:chatId",
  authMiddleware,
  getMessages
);

export default router;