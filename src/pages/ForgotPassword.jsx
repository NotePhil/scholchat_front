import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" or "confirmation"

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear message when user starts typing
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Updated endpoint to match the backend API
      const response = await fetch(
        "http://localhost:8486/auth/reset-password-request?email=" +
          encodeURIComponent(email),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // No body needed as we're using query parameter
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec de la demande");
      }

      // Success - show confirmation
      setStep("confirmation");
      setMessage({
        text: "Instructions envoyées! Vérifiez votre boîte de réception.",
        type: "success",
      });
    } catch (err) {
      console.error("Erreur lors de la demande:", err);
      setMessage({
        text:
          err.message ||
          "Une erreur s'est produite. Veuillez vérifier votre email et réessayer.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2 className="forgot-password-title">
          {step === "request" ? "Mot de passe oublié" : "Vérifiez votre email"}
        </h2>
        <p className="forgot-password-subtitle">
          {step === "request"
            ? "Entrez votre adresse e-mail pour recevoir un lien de réinitialisation"
            : "Nous avons envoyé les instructions de réinitialisation à votre adresse e-mail"}
        </p>

        <div className="forgot-password-form">
          {step === "request" ? (
            <form onSubmit={handleSubmit}>
              {message.text && (
                <div
                  className={`message-box ${
                    message.type === "error"
                      ? "error-message"
                      : "success-message"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email" className="forgot-password-label">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Entrez votre adresse e-mail"
                  className="forgot-password-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="forgot-password-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-text">
                    <span className="loading-spinner"></span>
                    Envoi en cours...
                  </span>
                ) : (
                  "Envoyer les instructions"
                )}
              </button>
            </form>
          ) : (
            <div className="confirmation-content">
              <div className="success-icon">✓</div>
              <p className="confirmation-message">
                Si un compte existe avec l'adresse <strong>{email}</strong>,
                vous recevrez un email avec les instructions pour réinitialiser
                votre mot de passe.
              </p>
              <p className="confirmation-note">
                Vérifiez également votre dossier spam si vous ne trouvez pas
                l'email.
              </p>
            </div>
          )}

          <div className="forgot-password-footer">
            <button
              onClick={() => navigate("/schoolchat/login")}
              className="back-to-login-button"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
