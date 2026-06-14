import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAdminStats } from "../services/adminService";

import "../styles/dashboard.css";

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAdminStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
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

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Overview</h1>
        <p>
          Platform activity at a glance.
        </p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>
            {stats?.pendingReports ?? 0}
          </strong>
          <span>Pending water waste reports</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.activeBookings ?? 0}
          </strong>
          <span>Active bookings</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.customerCount ?? 0}
          </strong>
          <span>Customers</span>
        </div>

        <div className="stat-card">
          <strong>
            {stats?.plumberCount ?? 0}
          </strong>
          <span>Plumbers</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link
          to="/dashboard/reports"
          className="dashboard-link-btn"
        >
          Review reports
        </Link>

        <Link
          to="/dashboard/bookings"
          className="dashboard-link-btn"
        >
          View bookings
        </Link>
      </div>
    </div>
  );
};

export default Overview;
