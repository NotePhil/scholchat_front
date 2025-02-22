import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Login.css";

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateCredentials = (email, password) => {
    const credentials = {
      "admin@gmail.com": { password: "Admin", role: "admin" },
      "professor@gmail.com": { password: "Professor", role: "professor" },
      "repetiteur@gmail.com": { password: "Repetiteur", role: "repetiteur" },
      "student@gmail.com": { password: "Student", role: "student" },
      "parent@gmail.com": { password: "Parent", role: "parent" },
    };

    return credentials[email]?.password === password
      ? credentials[email].role
      : null;
  };

  // In Login.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    const userRole = validateCredentials(email, password);

    if (!userRole) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Store user role in localStorage
    localStorage.setItem("userRole", userRole);

    // Handle navigation based on user role
    if (userRole === "professor" || userRole === "repetiteur") {
      // Pass state to indicate we need to show the modal
      navigate("/postLogin/classModal", { state: { showClassModal: true } });
    } else {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Let's get started now!</h2>
        <p className="login-subtitle">
          Or <span className="create-account">create an account</span> if not
          registered yet
        </p>

        <div className="login-form">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            <label htmlFor="email" className="login-label">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="mail@mail.com"
              className="login-input"
              required
            />

            <label htmlFor="password" className="login-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="login-input"
              required
            />

            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="remember-checkbox"
              />
              <label htmlFor="remember" className="remember-label">
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              className="login-button hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          <a href="/forgot-password" className="forgot-password">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
