import React from "react";
import "../CSS/Login.css"; // Import CSS for additional styling
import img from "../components/assets/images/logo.png";

export const Login = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Let’s get started now!</h2>
        <p className="login-subtitle">
          Or <span className="create-account">create an account</span> if not
          registered yet
        </p>

        <div className="login-form">
          <form>
            {/* Username Field */}
            <label htmlFor="username" className="login-label">
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Your username"
              className="login-input"
              required
            />

            {/* Email Field */}
            <label htmlFor="email" className="login-label">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="mail@mail.com"
              className="login-input"
              required
            />

            {/* Password Field */}
            <label htmlFor="password" className="login-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className="login-input"
              required
            />

            {/* Remember Me Checkbox */}
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                className="remember-checkbox"
              />
              <label htmlFor="remember" className="remember-label">
                Remember Me
              </label>
            </div>

            {/* Sign In Button */}
            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>

          {/* Forgot Password Link */}
          <a href="/forgot-password" className="forgot-password">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
