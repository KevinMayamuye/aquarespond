import { useEffect, useRef, useState } from "react";

import PreviewableImage from "../components/PreviewableImage";
import SelectWithOther from "../components/SelectWithOther";

import {
  getMyWaterWasteReports,
  submitWaterWasteReport,
} from "../services/reportService";
import { resizeImageToBase64 } from "../utils/resizeImage";
import {
  resolveSelectWithOther,
  validateSelectWithOther,
} from "../utils/resolveSelectWithOther";

import "../styles/report.css";

const REPORT_DESCRIPTION_OPTIONS = [
  "Report leaks",
  "Burst pipes",
  "Illegal connections",
];

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

const Report = () => {
  const fileInputRef = useRef(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [photoPreview, setPhotoPreview] =
    useState(null);
  const [photoData, setPhotoData] =
    useState(null);
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getMyWaterWasteReports()
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");

    try {
      const base64 =
        await resizeImageToBase64(file);

      setPhotoData(base64);
      setPhotoPreview(base64);
    } catch (err) {
      setError(
        err.message || "Could not process photo"
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setPhotoData(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.target);
    const choice = form.get("descriptionChoice");
    const custom = form.get("descriptionCustom");

    const validationError =
      validateSelectWithOther(choice, custom);

    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    const description = resolveSelectWithOther(
      choice,
      custom
    );

    try {
      const report =
        await submitWaterWasteReport({
          address: form.get("address"),
          description,
          severity: form.get("severity"),
          ...(photoData && { photo: photoData }),
        });

      setReports((prev) => [report, ...prev]);
      e.target.reset();
      handleRemovePhoto();
      setFormKey((prev) => prev + 1);
      alert("Report submitted. An admin will review it.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not submit report"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="report-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <h1>Report water waste</h1>
        <p>
          Tell us about leaks or water waste in
          your area. Reports are sent to the admin
          team for review.
        </p>
      </header>

      <div className="report-layout">
        <section className="report-section">
          <h2>New report</h2>

          <form
            key={formKey}
            className="report-form"
            onSubmit={handleSubmit}
          >
            <label>
              Location / address
              <input
                type="text"
                name="address"
                placeholder="Street address or area"
                required
              />
            </label>

            <SelectWithOther
              label="Description"
              options={REPORT_DESCRIPTION_OPTIONS}
              selectName="descriptionChoice"
              customName="descriptionCustom"
              otherPlaceholder="Describe the issue..."
              required
            />

            <label>
              Severity
              <select
                name="severity"
                defaultValue="medium"
              >
                <option value="low">Low</option>
                <option value="medium">
                  Medium
                </option>
                <option value="high">High</option>
              </select>
            </label>

            <div className="report-photo-field">
              <span className="report-photo-label">
                Photo (optional)
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="report-file-input"
                onChange={handlePhotoChange}
              />

              <div className="report-photo-actions">
                <button
                  type="button"
                  className="report-photo-btn"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  Add photo
                </button>

                {photoPreview && (
                  <button
                    type="button"
                    className="report-photo-btn secondary"
                    onClick={handleRemovePhoto}
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {photoPreview && (
                <PreviewableImage
                  src={photoPreview}
                  alt="Report preview"
                  className="report-photo-preview"
                />
              )}
            </div>

            {error && (
              <p className="report-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit report"}
            </button>
          </form>
        </section>

        <section className="report-section report-section-wide">
          <h2>My reports</h2>

          {reports.length === 0 ? (
            <p className="report-empty">
              No reports submitted yet.
            </p>
          ) : (
            <div className="report-list">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="report-card"
                >
                  <div className="report-card-top">
                    <strong>
                      {report.address}
                    </strong>
                    <span
                      className={`report-status status-${report.status}`}
                    >
                      {statusLabel[
                        report.status
                      ] || report.status}
                    </span>
                  </div>

                  <p>{report.description}</p>

                  <p className="report-meta">
                    Severity:{" "}
                    {severityLabel[
                      report.severity
                    ] || report.severity}
                    {" · "}
                    {new Date(
                      report.createdAt
                    ).toLocaleString()}
                  </p>

                  {report.assignedPlumber && (
                    <p className="report-meta">
                      Assigned plumber:{" "}
                      {
                        report.assignedPlumber
                          .username
                      }
                    </p>
                  )}

                  {report.photo && (
                    <PreviewableImage
                      src={report.photo}
                      alt="Report"
                      className="report-card-photo"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Report;
