import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Avatar from "../components/Avatar";

import { useAuth } from "../hooks/useAuth";
import { registerUser } from "../services/authService";
import { updateMyProfile } from "../services/userService";
import { resizeImageToBase64 } from "../utils/resizeImage";

import "../styles/auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [avatarPreview, setAvatarPreview] =
    useState(null);
  const [avatarFile, setAvatarFile] =
    useState(null);

  const fileInputRef = useRef(null);
  const avatarPreviewRef = useRef(null);
  const navigate = useNavigate();

  const { user, login, updateUser } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(
          avatarPreviewRef.current
        );
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(
        avatarPreviewRef.current
      );
    }

    const previewUrl = URL.createObjectURL(file);

    avatarPreviewRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await registerUser(formData);

      login(data);

      if (avatarFile) {
        const profilePicture =
          await resizeImageToBase64(avatarFile);

        const updated = await updateMyProfile({
          profilePicture,
        });

        updateUser({
          profilePicture: updated.profilePicture,
        });
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        error.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <h2>Register</h2>

        <div className="profile-avatar-section register-avatar-section">
          <Avatar
            user={{
              username: formData.username || "?",
              profilePicture: avatarPreview,
            }}
            size="lg"
          />

          <label
            htmlFor="register-avatar"
            className="visually-hidden"
          >
            Profile photo
          </label>
          <input
            ref={fileInputRef}
            id="register-avatar"
            name="avatar"
            type="file"
            accept="image/*"
            className="profile-file-input"
            onChange={handleAvatarChange}
          />

          <button
            type="button"
            className="profile-btn"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            {avatarPreview
              ? "Change photo"
              : "Add profile photo (optional)"}
          </button>
        </div>

        <label htmlFor="register-username">
          Username
        </label>
        <input
          id="register-username"
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          minLength={2}
          required
        />

        <label htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        <button type="submit">
          Register
        </button>

        <p>
          Already have an account?{" "}
          <Link to="/">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
