import Booking from "../models/Booking.js";
import User from "../models/User.js";
import WaterWasteReport from "../models/WaterWasteReport.js";

import { getIO } from "../socket/socketManager.js";
import { notifyAdmins } from "../utils/notifyAdmins.js";
import { serverError } from "../utils/serverError.js";
import { populateReport } from "./reportController.js";

const userFields =
  "username email role phone serviceArea isAvailable profilePicture createdAt";

const bookingUserFields =
  "username email profilePicture phone serviceArea";

const populateBooking = (query) =>
  query
    .populate("customer", bookingUserFields)
    .populate("plumber", bookingUserFields);

const REPORT_STATUSES = [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
];

const CLOSED_STATUSES = ["resolved", "dismissed"];

export const getAdminStats = async (req, res) => {
  try {
    const [
      pendingReports,
      activeBookings,
      customerCount,
      plumberCount,
      adminCount,
    ] = await Promise.all([
      WaterWasteReport.countDocuments({
        status: "pending",
      }),
      Booking.countDocuments({
        status: "accepted",
      }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "plumber" }),
      User.countDocuments({ role: "admin" }),
    ]);

    res.status(200).json({
      pendingReports,
      activeBookings,
      customerCount,
      plumberCount,
      adminCount,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getAdminWaterWasteReports = async (
  req,
  res
) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (
      status &&
      REPORT_STATUSES.includes(status)
    ) {
      filter.status = status;
    }

    const reports = await populateReport(
      WaterWasteReport.find(filter).sort({
        createdAt: -1,
      })
    );

    res.status(200).json(reports);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getAvailablePlumbers = async (
  req,
  res
) => {
  try {
    const plumbers = await User.find({
      role: "plumber",
      isAvailable: true,
    })
      .select(
        "username email serviceArea phone isAvailable"
      )
      .sort({ username: 1 });

    res.status(200).json(plumbers);
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateAdminWaterWasteReport = async (
  req,
  res
) => {
  try {
    const { status, adminNotes, plumberId } =
      req.body;

    const report =
      await WaterWasteReport.findById(
        req.params.id
      );

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    if (
      status !== undefined &&
      !REPORT_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    if (status !== undefined) {
      report.status = status;
    }

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes.trim();
    }

    if (plumberId !== undefined) {
      if (CLOSED_STATUSES.includes(report.status)) {
        return res.status(400).json({
          message:
            "Cannot assign a closed report",
        });
      }

      if (plumberId === null) {
        report.assignedPlumber = null;
        report.assignedAt = null;
      } else {
        const plumber = await User.findOne({
          _id: plumberId,
          role: "plumber",
          isAvailable: true,
        });

        if (!plumber) {
          return res.status(400).json({
            message:
              "Plumber not found or unavailable",
          });
        }

        report.assignedPlumber = plumber._id;
        report.assignedAt = new Date();

        if (report.status === "pending") {
          report.status = "under_review";
        }
      }
    }

    await report.save();

    const populated = await populateReport(
      WaterWasteReport.findById(report._id)
    );

    if (report.assignedPlumber) {
      getIO()
        .to(report.assignedPlumber.toString())
        .emit("reportAssigned", populated);
    }

    await notifyAdmins(
      "waterWasteReportUpdated",
      populated
    );

    if (populated.reporter) {
      const reporterId =
        populated.reporter._id ??
        populated.reporter;

      getIO()
        .to(reporterId.toString())
        .emit(
          "waterWasteReportUpdated",
          populated
        );
    }

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = {};

    if (role === "customer" || role === "plumber") {
      filter.role = role;
    } else if (role) {
      return res.status(400).json({
        message: "Invalid role filter",
      });
    } else {
      filter.role = { $in: ["customer", "plumber"] };
    }

    const users = await User.find(filter)
      .select(userFields)
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "plumber") {
      return res.status(400).json({
        message:
          "Only plumber availability can be updated",
      });
    }

    if (
      typeof req.body.isAvailable !== "boolean"
    ) {
      return res.status(400).json({
        message: "isAvailable must be a boolean",
      });
    }

    user.isAvailable = req.body.isAvailable;
    await user.save();

    const updated = await User.findById(
      user._id
    ).select(userFields);

    res.status(200).json(updated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getAdminBookings = async (
  req,
  res
) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({
        scheduledAt: -1,
      })
    );

    res.status(200).json(bookings);
  } catch (error) {
    return serverError(res, error);
  }
};
