import {
  NavLink,
  Outlet,
} from "react-router-dom";

import NavLinkWithDot from "../components/NavLinkWithDot";

import { useAuth } from "../hooks/useAuth";

import "../styles/shell.css";

const AdminShell = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-nav">
        <div className="app-nav-brand">
          Admin
        </div>

        <nav className="app-nav-links">
          <NavLinkWithDot
            to="/dashboard"
            end
            dotKey="overview"
          >
            Overview
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/reports"
            dotKey="reports"
          >
            Reports
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/users"
            dotKey="users"
          >
            Users
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/bookings"
            dotKey="bookings"
          >
            Bookings
          </NavLinkWithDot>

          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Profile
          </NavLink>
        </nav>

        <div className="app-nav-footer">
          <span className="app-nav-user">
            {user?.username}
          </span>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminShell;
