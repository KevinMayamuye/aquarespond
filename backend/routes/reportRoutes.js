import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createWaterWasteReport,
  getMyWaterWasteReports,
  getMyAssignedReports,
  updateAssignedReportStatus,
} from "../controllers/reportController.js";

const router = express.Router();

router.post(
  "/water-waste",
  authMiddleware,
  requireRole("customer"),
  createWaterWasteReport
);

router.get(
  "/water-waste/mine",
  authMiddleware,
  requireRole("customer"),
  getMyWaterWasteReports
);

router.get(
  "/assignments/mine",
  authMiddleware,
  requireRole("plumber"),
  getMyAssignedReports
);

router.patch(
  "/assignments/:id",
  authMiddleware,
  requireRole("plumber"),
  updateAssignedReportStatus
);

export default router;
