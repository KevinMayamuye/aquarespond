import { NavLink } from "react-router-dom";

import { useNotifications } from "../hooks/useNotifications";

const NavLinkWithDot = ({
  to,
  dotKey,
  end,
  children,
}) => {
  const { dots } = useNotifications();

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? "active" : undefined
      }
    >
      {children}
      {dots[dotKey] && (
        <>
          <span
            className="nav-dot"
            aria-hidden="true"
          />
          <span className="visually-hidden">
            , new activity
          </span>
        </>
      )}
    </NavLink>
  );
};

export default NavLinkWithDot;
