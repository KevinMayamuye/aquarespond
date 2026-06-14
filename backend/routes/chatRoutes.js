import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getChats,
  createOrGetChat,
  createGroupChat,
  getOrCreateSupportChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getChats
);

router.post(
  "/support",
  authMiddleware,
  requireRole("customer", "plumber"),
  getOrCreateSupportChat
);

router.post(
  "/group",
  authMiddleware,
  createGroupChat
);

router.post(
  "/",
  authMiddleware,
  createOrGetChat
);

export default router;