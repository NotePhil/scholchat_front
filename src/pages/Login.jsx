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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email === "admin@gmail.com" && formData.password === "Admin") {
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
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
            {error && <div className="error-message">{error}</div>}
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
            <button type="submit" className="login-button">
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
