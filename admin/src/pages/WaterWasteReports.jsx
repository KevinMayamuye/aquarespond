import { useCallback, useEffect, useState } from "react";

import PreviewableImage from "../components/PreviewableImage";

import {
  getAdminWaterWasteReports,
  getAvailablePlumbers,
  updateAdminWaterWasteReport,
} from "../services/adminService";

import { socket } from "../socket/socket";

import "../styles/dashboard.css";

const statusLabel = {
  pending: "Pending",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const severityLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const ASSIGNABLE_STATUSES = [
  "pending",
  "under_review",
];

const WaterWasteReports = () => {
  const [reports, setReports] = useState([]);
  const [plumbers, setPlumbers] = useState([]);
  const [statusFilter, setStatusFilter] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [notesDraft, setNotesDraft] = useState({});
  const [assignDraft, setAssignDraft] = useState(
    {}
  );

  const loadReports = useCallback(async (status) => {
    try {
      const data =
        await getAdminWaterWasteReports(
          status || undefined
        );

      setReports(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminWaterWasteReports(),
      getAvailablePlumbers(),
    ])
      .then(([reportData, plumberData]) => {
        if (cancelled) return;

        setReports(reportData);
        setPlumbers(plumberData);
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
      loadReports(statusFilter);
      getAvailablePlumbers()
        .then(setPlumbers)
        .catch(console.error);
    };

    socket.on("waterWasteReported", refresh);
    socket.on("waterWasteReportUpdated", refresh);

    return () => {
      socket.off("waterWasteReported", refresh);
      socket.off("waterWasteReportUpdated", refresh);
    };
  }, [loadReports, statusFilter]);

  const handleFilterChange = async (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setLoading(true);

    await loadReports(value);
    setLoading(false);
  };

  const handleStatusChange = async (
    reportId,
    status
  ) => {
    try {
      const updated =
        await updateAdminWaterWasteReport(
          reportId,
          { status }
        );

      setReports((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not update report"
      );
    }
  };

  const handleSaveNotes = async (reportId) => {
    try {
      const updated =
        await updateAdminWaterWasteReport(
          reportId,
          {
            adminNotes:
              notesDraft[reportId] ?? "",
          }
        );

      setReports((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not save notes"
      );
    }
  };

  const handleAssign = async (reportId) => {
    const plumberId = assignDraft[reportId];

    if (!plumberId) {
      alert("Select a plumber first");
      return;
    }

    try {
      const updated =
        await updateAdminWaterWasteReport(
          reportId,
          { plumberId }
        );

      setReports((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not assign report"
      );
    }
  };

  const handleUnassign = async (reportId) => {
    try {
      const updated =
        await updateAdminWaterWasteReport(
          reportId,
          { plumberId: null }
        );

      setReports((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not unassign report"
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Water waste reports</h1>
        <p>
          Review and triage customer submissions.
        </p>
      </header>

      <div className="filter-row">
        <label htmlFor="reports-status-filter">
          Status
        </label>
        <select
          id="reports-status-filter"
          name="statusFilter"
          value={statusFilter}
          onChange={handleFilterChange}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">
            Under review
          </option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">
            Dismissed
          </option>
        </select>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">
          No reports found.
        </p>
      ) : (
        reports.map((report) => {
          const isAssignable =
            ASSIGNABLE_STATUSES.includes(
              report.status
            );

          return (
            <div
              key={report._id}
              className="data-card"
            >
              <div className="data-card-top">
                <strong>{report.address}</strong>
                <span
                  className={`status-badge status-${report.status}`}
                >
                  {statusLabel[report.status] ||
                    report.status}
                </span>
              </div>

              <p>{report.description}</p>

              <p className="card-meta">
                Reporter:{" "}
                {report.reporter?.username ||
                  "Unknown"}
                {" · "}
                Severity:{" "}
                {severityLabel[report.severity] ||
                  report.severity}
                {" · "}
                {new Date(
                  report.createdAt
                ).toLocaleString()}
              </p>

              <p className="card-meta">
                Assigned to:{" "}
                {report.assignedPlumber
                  ?.username || "Unassigned"}
              </p>

              {report.photo && (
                <PreviewableImage
                  src={report.photo}
                  alt="Report"
                  className="report-photo"
                />
              )}

              {isAssignable && (
                <div className="assign-row">
                  <label
                    htmlFor={`assign-plumber-${report._id}`}
                  >
                    Assign plumber
                  </label>
                  <select
                    id={`assign-plumber-${report._id}`}
                    name="assignedPlumber"
                    value={
                      assignDraft[report._id] ??
                      report.assignedPlumber
                        ?._id ??
                      ""
                    }
                    onChange={(e) =>
                      setAssignDraft((prev) => ({
                        ...prev,
                        [report._id]:
                          e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select plumber
                    </option>
                    {plumbers.map((plumber) => (
                      <option
                        key={plumber._id}
                        value={plumber._id}
                      >
                        {plumber.username}
                        {plumber.serviceArea
                          ? ` (${plumber.serviceArea})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      handleAssign(report._id)
                    }
                  >
                    Assign
                  </button>

                  {report.assignedPlumber && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        handleUnassign(
                          report._id
                        )
                      }
                    >
                      Unassign
                    </button>
                  )}
                </div>
              )}

              <div className="card-actions">
                <label
                  htmlFor={`report-status-${report._id}`}
                >
                  Report status
                </label>
                <select
                  id={`report-status-${report._id}`}
                  name="status"
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

              <div className="card-actions">
                <label
                  htmlFor={`admin-notes-${report._id}`}
                >
                  Admin notes
                </label>
                <textarea
                  id={`admin-notes-${report._id}`}
                  name="adminNotes"
                  placeholder="Admin notes"
                  value={
                    notesDraft[report._id] ??
                    report.adminNotes ??
                    ""
                  }
                  onChange={(e) =>
                    setNotesDraft((prev) => ({
                      ...prev,
                      [report._id]:
                        e.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    handleSaveNotes(report._id)
                  }
                >
                  Save notes
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default WaterWasteReports;
