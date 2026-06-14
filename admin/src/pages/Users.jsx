import { useEffect, useState } from "react";

import {
  getAdminUsers,
  updateAdminUser,
} from "../services/adminService";

import "../styles/dashboard.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] =
    useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async (role = roleFilter) => {
    try {
      const data = await getAdminUsers(
        role || undefined
      );

      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getAdminUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
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

  const handleFilterChange = async (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    setLoading(true);

    await loadUsers(value);
    setLoading(false);
  };

  const handleToggleAvailability = async (
    user
  ) => {
    try {
      const updated = await updateAdminUser(
        user._id,
        {
          isAvailable: !user.isAvailable,
        }
      );

      setUsers((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? updated
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not update user"
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Users</h1>
        <p>
          Manage customers and plumbers on the
          platform.
        </p>
      </header>

      <div className="filter-row">
        <select
          value={roleFilter}
          onChange={handleFilterChange}
        >
          <option value="">All roles</option>
          <option value="customer">
            Customers
          </option>
          <option value="plumber">
            Plumbers
          </option>
        </select>
      </div>

      {users.length === 0 ? (
        <p className="empty-state">
          No users found.
        </p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role === "plumber"
                    ? `${user.serviceArea || "—"} · ${user.isAvailable ? "Available" : "Unavailable"}`
                    : "—"}
                </td>
                <td>
                  {user.role === "plumber" && (
                    <button
                      type="button"
                      className={`toggle-btn ${
                        user.isAvailable
                          ? "available"
                          : "unavailable"
                      }`}
                      onClick={() =>
                        handleToggleAvailability(
                          user
                        )
                      }
                    >
                      {user.isAvailable
                        ? "Disable"
                        : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Users;
