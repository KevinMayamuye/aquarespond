import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  listPlumbers,
  getPlumberById,
} from "../controllers/plumberController.js";

import {
  createBooking,
  getMyBookings,
  getIncomingBookings,
  getActiveBookings,
  getBookingHistory,
  acceptBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.get(
  "/plumbers",
  authMiddleware,
  requireRole("customer"),
  listPlumbers
);

router.get(
  "/plumbers/:id",
  authMiddleware,
  requireRole("customer"),
  getPlumberById
);

router.post(
  "/",
  authMiddleware,
  requireRole("customer"),
  createBooking
);

router.get(
  "/mine",
  authMiddleware,
  requireRole("customer"),
  getMyBookings
);

router.get(
  "/incoming",
  authMiddleware,
  requireRole("plumber"),
  getIncomingBookings
);

router.get(
  "/active",
  authMiddleware,
  requireRole("plumber"),
  getActiveBookings
);

router.get(
  "/history",
  authMiddleware,
  getBookingHistory
);

router.put(
  "/:id/accept",
  authMiddleware,
  requireRole("plumber"),
  acceptBooking
);

router.put(
  "/:id/decline",
  authMiddleware,
  requireRole("plumber"),
  declineBooking
);

router.put(
  "/:id/cancel",
  authMiddleware,
  cancelBooking
);

router.put(
  "/:id/complete",
  authMiddleware,
  requireRole("plumber"),
  completeBooking
);

export default router;
