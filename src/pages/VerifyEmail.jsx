import React, { useState } from "react";
import { Mail, Loader, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const handleResendVerification = async () => {
    if (isResendingEmail || !email) return;
    try {
      setIsResendingEmail(true);
      const resendUrl =
        "http://localhost:8486/scholchat/auth/resend-verification";
      const response = await fetch(resendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const responseData = await response.text();
      if (!response.ok) {
        throw new Error(
          responseData || "Échec de l'envoi de l'e-mail de vérification"
        );
      }
      showAlert(
        "L'e-mail de vérification a été renvoyé. Veuillez vérifier votre boîte de réception.",
        "success"
      );
    } catch (err) {
      console.error("Erreur de renvoi de vérification:", err);
      showAlert(
        err.message ||
          "Échec de l'envoi de l'e-mail de vérification. Veuillez réessayer."
      );
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="verification-page">
      {alertMessage && (
        <div className={`alert-message ${alertType}`}>{alertMessage}</div>
      )}
      <div className="verification-container">
        <div className="verification-icon">
          <Mail size={64} strokeWidth={1.5} />
        </div>
        <h2>Vérifiez votre e-mail</h2>
        <p className="verification-message">
          Nous avons envoyé un e-mail de vérification à <strong>{email}</strong>
        </p>
        <p className="verification-instructions">
          Veuillez vérifier votre boîte de réception et cliquer sur le lien de
          vérification pour activer votre compte. Si vous ne voyez pas l'e-mail,
          veuillez vérifier votre dossier de spam.
        </p>
        <div className="verification-actions">
          <button
            type="button"
            className="action-button resend-button"
            onClick={handleResendVerification}
            disabled={isResendingEmail}
          >
            {isResendingEmail ? (
              <>
                <Loader className="button-icon animate-spin" size={18} />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Mail className="button-icon" size={18} />
                <span>Renvoyer l'e-mail</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="action-button login-button"
            onClick={() => navigate("/login")}
          >
            <span>Aller à la connexion</span>
            <ArrowRight className="button-icon" size={18} />
          </button>
        </div>
      </div>
      <style jsx>{`
        .verification-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a365d, #2d3748);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .verification-container {
          width: 100%;
          max-width: 600px;
          background: white;
          padding: 3rem 2rem;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          text-align: center;
        }
        .verification-icon {
          width: 110px;
          height: 110px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f5e9;
          border-radius: 50%;
          color: #4caf50;
        }
        .verification-page h2 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 1.2rem;
          font-weight: 600;
        }
        .verification-message {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #424242;
        }
        .verification-instructions {
          color: #666;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .verification-actions {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 2.5rem;
          padding: 0 1rem;
        }
        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
          transition: all 0.3s ease;
          width: 200px;
          height: 48px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .button-icon {
          flex-shrink: 0;
        }
        .resend-button {
          background: #f0f4f8;
          color: #2d3748;
          border: 1px solid #dde5ed;
        }
        .resend-button:hover:not(:disabled) {
          background: #e1e8f0;
          transform: translateY(-2px);
        }
        .resend-button:disabled {
          background: #eaeaea;
          color: #999;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .login-button {
          background: #4caf50;
          color: white;
          border: 1px solid #4caf50;
        }
        .login-button:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
        }
        .alert-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 6px;
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          text-align: left;
        }
        .alert-message.error {
          background: #fff2f2;
          color: #e53935;
          border-left: 4px solid #e53935;
        }
        .alert-message.success {
          background: #f1f8e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .verification-container {
            margin: 1rem;
            padding: 2rem 1.5rem;
          }
          .verification-actions {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .action-button {
            width: 100%;
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
