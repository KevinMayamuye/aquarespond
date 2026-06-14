import {
  NavLink,
  Outlet,
} from "react-router-dom";

import NavLinkWithDot from "../components/NavLinkWithDot";

import { useAuth } from "../hooks/useAuth";

import "../styles/shell.css";

const PlumberShell = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-nav">
        <div className="app-nav-brand">
          Plumber
        </div>

        <nav className="app-nav-links">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Dashboard
          </NavLink>

          <NavLinkWithDot
            to="/dashboard/jobs"
            dotKey="jobs"
          >
            Jobs
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/reports"
            dotKey="reports"
          >
            Reports
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/history"
            dotKey="history"
          >
            History
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/chat"
            dotKey="chat"
          >
            Chat
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

export default PlumberShell;
