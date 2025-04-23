import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    token: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Extract token and email from URL query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      setFormData((prev) => ({ ...prev, token, email }));
    } else {
      setTokenValid(false);
      setMessage({
        text: "Lien de réinitialisation invalide ou expiré.",
        type: "error",
      });
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear message when user starts typing
    if (message.text) setMessage({ text: "", type: "" });
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      setMessage({
        text: "Le mot de passe doit contenir au moins 8 caractères.",
        type: "error",
      });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({
        text: "Les mots de passe ne correspondent pas.",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(
        "http://localhost:8486/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: formData.token,
            email: formData.email,
            newPassword: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Échec de la réinitialisation du mot de passe"
        );
      }

      // Success
      setMessage({
        text: "Mot de passe réinitialisé avec succès!",
        type: "success",
      });

      // Redirect to login after successful password reset
      setTimeout(() => {
        navigate("/schoolchat/login");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      setMessage({
        text:
          err.message ||
          "Une erreur s'est produite. Veuillez réessayer ou demander un nouveau lien.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2 className="reset-password-title">
          Réinitialisation du mot de passe
        </h2>

        {!tokenValid ? (
          <div className="invalid-token-message">
            <p>Lien de réinitialisation invalide ou expiré.</p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="request-new-link-button"
            >
              Demander un nouveau lien
            </button>
          </div>
        ) : (
          <div className="reset-password-form">
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
                <label htmlFor="password" className="reset-password-label">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Entrez votre nouveau mot de passe"
                  className="reset-password-input"
                  required
                  minLength="8"
                />
              </div>

              <div className="input-group">
                <label
                  htmlFor="confirmPassword"
                  className="reset-password-label"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                  className="reset-password-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="reset-password-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-text">
                    <span className="loading-spinner"></span>
                    Réinitialisation en cours...
                  </span>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </button>
            </form>

            <div className="reset-password-footer">
              <button
                onClick={() => navigate("/login")}
                className="back-to-login-button"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
//
