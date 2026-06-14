import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getMyProfile,
  getUserById,
  searchUsers,
  updateMyProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.get(
  "/search",
  authMiddleware,
  searchUsers
);

router.get(
  "/me",
  authMiddleware,
  getMyProfile
);

router.put(
  "/me",
  authMiddleware,
  updateMyProfile
);

router.get(
  "/:id",
  authMiddleware,
  getUserById
);

export default router;