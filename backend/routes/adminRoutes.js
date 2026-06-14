import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getAdminStats,
  getAdminWaterWasteReports,
  getAvailablePlumbers,
  updateAdminWaterWasteReport,
  getAdminUsers,
  updateAdminUser,
  getAdminBookings,
} from "../controllers/adminController.js";

import {
  getAdminRatings,
  updateAdminRating,
} from "../controllers/ratingController.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/stats", getAdminStats);

router.get(
  "/reports/water-waste",
  getAdminWaterWasteReports
);

router.patch(
  "/reports/water-waste/:id",
  updateAdminWaterWasteReport
);

router.get(
  "/plumbers/available",
  getAvailablePlumbers
);

router.get("/users", getAdminUsers);

router.patch("/users/:id", updateAdminUser);

router.get("/bookings", getAdminBookings);

router.get("/ratings", getAdminRatings);

router.patch(
  "/ratings/:id",
  updateAdminRating
);

export default router;
