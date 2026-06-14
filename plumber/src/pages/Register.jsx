import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { registerPlumber } from "../services/authService";

import "../styles/shell.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    serviceArea: "",
  });

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await registerPlumber(formData);
      login(data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
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
        <h2>Plumber Register</h2>

        <label htmlFor="plumber-register-username">
          Username
        </label>
        <input
          id="plumber-register-username"
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({
              ...formData,
              username: e.target.value,
            })
          }
          required
        />

        <label htmlFor="plumber-register-email">
          Email
        </label>
        <input
          id="plumber-register-email"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
          required
        />

        <label htmlFor="plumber-register-password">
          Password
        </label>
        <input
          id="plumber-register-password"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({
              ...formData,
              password: e.target.value,
            })
          }
          required
        />

        <label htmlFor="plumber-register-phone">
          Phone
        </label>
        <input
          id="plumber-register-phone"
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
        />

        <label htmlFor="plumber-register-service-area">
          Service area
        </label>
        <input
          id="plumber-register-service-area"
          type="text"
          name="serviceArea"
          placeholder="Service area"
          value={formData.serviceArea}
          onChange={(e) =>
            setFormData({
              ...formData,
              serviceArea: e.target.value,
            })
          }
        />

        <button type="submit">Register</button>

        <p>
          Already registered?{" "}
          <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
