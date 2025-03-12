import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Check, AlertTriangle, Loader } from "lucide-react";
// Import the logo
import logoImage from "../components/assets/images/logo.png";

const AccountActivation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the activation token from the URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const activationToken = queryParams.get("activationToken");

  const [activationStatus, setActivationStatus] = useState("loading"); // loading, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Only proceed if we have the activation token from the URL
    if (!activationToken) return;

    const activateAccount = async () => {
      try {
        const apiUrl = `http://localhost:8486/scholchat/auth/activate?activationToken=${activationToken}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.message || "Activation failed. Please try again."
          );
        }

        setActivationStatus("success");

        // Start countdown for redirection
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error) {
        console.error("Activation error:", error);
        setActivationStatus("error");
        setErrorMessage(
          error.message || "An error occurred during account activation."
        );
      }
    };

    activateAccount();
  }, [activationToken, navigate]);

  return (
    <div className="activation-page">
      <div className="activation-container">
        <div className="logo-container">
          <img src={logoImage} alt="ScholChat Logo" className="logo" />
        </div>

        <div className="activation-content">
          <h1>Account Activation</h1>

          {activationStatus === "loading" && (
            <div className="status-box loading">
              <Loader className="animate-spin" size={48} />
              <p>Please wait while we verify your account...</p>
            </div>
          )}

          {activationStatus === "success" && (
            <div className="status-box success">
              <Check className="icon" size={48} />
              <h2>Account Successfully Activated!</h2>
              <p>Your account has been verified and activated.</p>
              <p>
                You will be redirected to the login page in {countdown}{" "}
                seconds...
              </p>
              <button
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Go to Login Now
              </button>
            </div>
          )}

          {activationStatus === "error" && (
            <div className="status-box error">
              <AlertTriangle className="icon" size={48} />
              <h2>Activation Failed</h2>
              <p>{errorMessage}</p>
              <p>If this problem persists, please contact support.</p>
              <div className="button-group">
                <button
                  className="login-button"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
                <button
                  className="support-button"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 ScholChat. All rights reserved.</p>
          <div className="footer-links">
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/contact">Contact Us</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .activation-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a365d, #2d3748);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .activation-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .logo-container {
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }

        .logo {
          height: 200px; /* Significantly increased from 80px */
          width: auto;
          max-width: 90%; /* Ensures logo doesn't overflow on smaller screens */
          object-fit: contain; /* Maintains aspect ratio */
        }

        .activation-content {
          width: 100%;
          max-width: 600px;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          margin-top: 1rem; /* Added to create more space after the larger logo */
        }

        h1 {
          color: #1a365d;
          margin-bottom: 2rem;
          font-size: 1.8rem;
        }

        h2 {
          margin-top: 0.5rem;
          font-size: 1.5rem;
        }

        .status-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .status-box.loading {
          background: #f0f9ff;
          color: #0369a1;
        }

        .status-box.success {
          background: #f0fdf4;
          color: #166534;
        }

        .status-box.error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .icon {
          margin-bottom: 1rem;
        }

        .login-button,
        .support-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin-top: 1.5rem;
        }

        .login-button {
          background: #4caf50;
          color: white;
        }

        .login-button:hover {
          background: #45a049;
        }

        .support-button {
          background: #f0f0f0;
          color: #333;
          margin-left: 1rem;
        }

        .support-button:hover {
          background: #e0e0e0;
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .footer {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 1.5rem;
          text-align: center;
          width: 100%;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }

        .footer-links a {
          color: white;
          text-decoration: none;
        }

        .footer-links a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .activation-content {
            padding: 1.5rem;
          }

          .status-box {
            padding: 1.5rem;
          }

          .button-group {
            flex-direction: column;
          }

          .support-button {
            margin-left: 0;
            margin-top: 1rem;
          }

          .footer-links {
            flex-direction: column;
            gap: 0.5rem;
          }

          .logo {
            height: 150px; /* Slightly smaller on mobile but still very large */
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AccountActivation;
