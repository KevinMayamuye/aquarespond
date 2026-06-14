import { useCallback, useEffect, useState } from "react";

import PreviewableImage from "../components/PreviewableImage";

import {
  getMyAssignedReports,
  updateAssignedReportStatus,
} from "../services/reportService";

import { socket } from "../socket/socket";

import "../styles/jobs.css";

const severityLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const statusLabel = {
  pending: "Pending",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const CLOSED_STATUSES = ["resolved", "dismissed"];

const ReportAssignments = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const data = await getMyAssignedReports();
      setReports(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getMyAssignedReports()
      .then((data) => {
        if (!cancelled) {
          setReports(data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refresh = () => {
      loadReports();
    };

    socket.on("reportAssigned", refresh);

    return () => {
      socket.off("reportAssigned", refresh);
    };
  }, [loadReports]);

  const handleStatusChange = async (
    reportId,
    status
  ) => {
    try {
      const updated =
        await updateAssignedReportStatus(
          reportId,
          { status }
        );

      if (CLOSED_STATUSES.includes(status)) {
        setReports((prev) =>
          prev.filter(
            (item) => item._id !== reportId
          )
        );
      } else {
        setReports((prev) =>
          prev.map((item) =>
            item._id === updated._id
              ? updated
              : item
          )
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not update report"
      );
    }
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <h1>Assigned reports</h1>
        <p>
          Water waste reports assigned to you for
          inspection.
        </p>
      </header>

      {reports.length === 0 ? (
        <p className="jobs-empty">
          No assigned reports.
        </p>
      ) : (
        reports.map((report) => (
          <div
            key={report._id}
            className="job-card"
          >
            <div className="job-card-top">
              <strong>{report.address}</strong>
              <span
                className={`job-status status-${report.status}`}
              >
                {statusLabel[report.status] ||
                  report.status}
              </span>
            </div>
            <p>{report.description}</p>
            <p>
              Severity:{" "}
              {severityLabel[report.severity] ||
                report.severity}
            </p>
            <p>
              Reporter:{" "}
              {report.reporter?.username ||
                "Customer"}
            </p>
            <p>
              Assigned:{" "}
              {report.assignedAt
                ? new Date(
                    report.assignedAt
                  ).toLocaleString()
                : "—"}
            </p>

            {report.photo && (
              <PreviewableImage
                src={report.photo}
                alt="Report"
                className="report-assignment-photo"
              />
            )}

            <div className="report-status-row">
              <select
                value={report.status}
                onChange={(e) =>
                  handleStatusChange(
                    report._id,
                    e.target.value
                  )
                }
              >
                <option value="pending">
                  Pending
                </option>
                <option value="under_review">
                  Under review
                </option>
                <option value="resolved">
                  Resolved
                </option>
                <option value="dismissed">
                  Dismissed
                </option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReportAssignments;
