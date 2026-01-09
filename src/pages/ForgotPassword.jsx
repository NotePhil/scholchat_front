import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/ForgotPassword.css";
import ForgotPasswordService from "../services/forgotPassword";

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
      // Call the service with just the email parameter
      await ForgotPasswordService.requestPasswordReset(email);

      // Si la requête réussit, montrer le message de confirmation
      setStep("confirmation");
      setMessage({
        text: "Instructions envoyées! Vérifiez votre boîte de réception.",
        type: "success",
      });
    } catch (error) {
      console.error("Erreur lors de la demande:", error);

      // Afficher le message d'erreur
      setMessage({
        text: "Erreur lors de l'envoi des instructions. Veuillez réessayer plus tard.",
        type: "error",
      });

      // Ne pas passer à l'étape de confirmation en cas d'erreur
      // setStep reste à "request"
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
