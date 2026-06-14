import WaterWasteReport from "../models/WaterWasteReport.js";

import { getIO } from "../socket/socketManager.js";
import { notifyAdmins } from "../utils/notifyAdmins.js";
import { serverError } from "../utils/serverError.js";

const MAX_PHOTO_LENGTH = 2_800_000;

const REPORT_STATUSES = [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
];

const reporterFields =
  "username email profilePicture";

const assignedPlumberFields =
  "username email phone serviceArea";

export const populateReport = (query) =>
  query
    .populate("reporter", reporterFields)
    .populate(
      "assignedPlumber",
      assignedPlumberFields
    );

const notifyReporter = (reportId, payload) => {
  const reporterId =
    payload.reporter?._id ?? payload.reporter;

  if (!reporterId) return;

  getIO()
    .to(reporterId.toString())
    .emit("waterWasteReportUpdated", payload);
};

export const createWaterWasteReport = async (
  req,
  res
) => {
  try {
    const { address, description, severity, photo } =
      req.body;

    if (!address?.trim() || !description?.trim()) {
      return res.status(400).json({
        message:
          "Address and description are required",
      });
    }

    if (
      photo !== undefined &&
      photo !== null &&
      typeof photo !== "string"
    ) {
      return res.status(400).json({
        message: "Photo must be a string or null",
      });
    }

    if (
      photo &&
      photo.length > MAX_PHOTO_LENGTH
    ) {
      return res.status(400).json({
        message: "Photo is too large",
      });
    }

    const allowedSeverities = [
      "low",
      "medium",
      "high",
    ];

    const reportSeverity =
      allowedSeverities.includes(severity)
        ? severity
        : "medium";

    const report = await WaterWasteReport.create({
      reporter: req.user._id,
      address: address.trim(),
      description: description.trim(),
      severity: reportSeverity,
      ...(photo && { photo }),
    });

    const populated = await populateReport(
      WaterWasteReport.findById(report._id)
    );

    await notifyAdmins(
      "waterWasteReported",
      populated
    );

    res.status(201).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMyWaterWasteReports = async (
  req,
  res
) => {
  try {
    const reports = await populateReport(
      WaterWasteReport.find({
        reporter: req.user._id,
      }).sort({ createdAt: -1 })
    );

    res.status(200).json(reports);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getMyAssignedReports = async (
  req,
  res
) => {
  try {
    const reports = await WaterWasteReport.find({
      assignedPlumber: req.user._id,
      status: {
        $in: ["pending", "under_review"],
      },
    })
      .populate("reporter", "username")
      .sort({ assignedAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    return serverError(res, error);
  }
};

export const updateAssignedReportStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (
      status === undefined ||
      !REPORT_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

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
      !report.assignedPlumber ||
      report.assignedPlumber.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    report.status = status;
    await report.save();

    const populated = await populateReport(
      WaterWasteReport.findById(report._id)
    );

    await notifyAdmins(
      "waterWasteReportUpdated",
      populated
    );

    notifyReporter(report._id, populated);

    res.status(200).json(populated);
  } catch (error) {
    return serverError(res, error);
  }
};
