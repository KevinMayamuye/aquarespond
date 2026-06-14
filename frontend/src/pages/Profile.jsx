import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "../components/Avatar";

import { useAuth } from "../hooks/useAuth";
import { updateMyProfile } from "../services/userService";
import { resizeImageToBase64 } from "../utils/resizeImage";

import "../styles/auth.css";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const profilePicture =
        await resizeImageToBase64(file);

      const updated = await updateMyProfile({
        profilePicture,
      });

      updateUser({
        profilePicture: updated.profilePicture,
      });
    } catch (err) {
      setError(
        err.message ||
        err.response?.data?.message ||
        "Could not upload photo"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setError("");

    try {
      const updated = await updateMyProfile({
        profilePicture: null,
      });

      updateUser({
        profilePicture: updated.profilePicture,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not remove photo"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="auth-form profile-form">
        <h2>My Profile</h2>

        <div className="profile-avatar-section">
          <Avatar user={user} size="lg" />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="profile-file-input"
            onChange={handleFileChange}
          />

          <div className="profile-avatar-actions">
            <button
              type="button"
              className="profile-btn"
              disabled={uploading}
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              {uploading
                ? "Uploading..."
                : "Change photo"}
            </button>

            {user?.profilePicture && (
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                disabled={uploading}
                onClick={handleRemovePhoto}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="profile-field">
          <label>Username</label>
          <p>{user?.username}</p>
        </div>

        <div className="profile-field">
          <label>Email</label>
          <p>{user?.email}</p>
        </div>

        {error && (
          <p className="profile-error">{error}</p>
        )}

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
