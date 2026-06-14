import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getMyPlumberRatings,
  getPlumberRatingDetails,
} from "../controllers/ratingController.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  requireRole("plumber"),
  getMyPlumberRatings
);

router.get(
  "/me/summary",
  authMiddleware,
  requireRole("plumber"),
  getPlumberRatingDetails
);

export default router;
