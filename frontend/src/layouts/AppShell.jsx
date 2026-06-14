import { NavLink, Outlet } from "react-router-dom";

import NavLinkWithDot from "../components/NavLinkWithDot";

import { useAuth } from "../hooks/useAuth";

import Avatar from "../components/Avatar";

import "../styles/shell.css";

const AppShell = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-nav">
        <div className="app-nav-brand">
          Aquarespond
        </div>

        <nav className="app-nav-links">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Home
          </NavLink>

          <NavLinkWithDot
            to="/dashboard/book"
            dotKey="book"
          >
            Book
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/history"
            dotKey="history"
          >
            History
          </NavLinkWithDot>

          <NavLinkWithDot
            to="/dashboard/report"
            dotKey="report"
          >
            Report
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
          <div className="app-nav-user">
            <Avatar user={user} size="sm" />
            <span>{user?.username}</span>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
