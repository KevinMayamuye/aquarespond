import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import "../styles/shell.css";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>My profile</h1>

        <div className="profile-field">
          <label>Username</label>
          <p>{user?.username}</p>
        </div>

        <div className="profile-field">
          <label>Email</label>
          <p>{user?.email}</p>
        </div>

        <div className="profile-field">
          <label>Role</label>
          <p>{user?.role}</p>
        </div>

        <button
          type="button"
          className="profile-logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
