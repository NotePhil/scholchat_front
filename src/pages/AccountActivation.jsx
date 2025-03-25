import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, AlertTriangle, Loader, Mail } from "lucide-react";
import { jwtDecode } from "jwt-decode";

// Import the logo
import logoImage from "../components/assets/images/logo.png";

const AccountActivation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the activation token from the URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const urlActivationToken = queryParams.get("activationToken");

  const [activationStatus, setActivationStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState("");
  const [activationToken, setActivationToken] = useState("");
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [regenerationStatus, setRegenerationStatus] = useState("");

  // Attempt to retrieve email from localStorage on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setUserEmail(storedEmail);
      setInputEmail(storedEmail);
    }
  }, []);

  const regenerateActivationToken = async () => {
    // If no email is retrieved from localStorage, show email input
    if (!inputEmail) {
      setShowEmailInput(true);
      return;
    }

    try {
      setActivationStatus("loading");
      setErrorMessage("");
      setRegenerationStatus("");

      const response = await fetch(
        "http://localhost:8486/scholchat/utilisateurs/regenerate-activation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: inputEmail }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData?.message || "Échec de la régénération du token"
        );
      }

      const data = await response.json();

      // Store the new email in localStorage
      localStorage.setItem("userEmail", data.email);

      setRegenerationStatus("success");

      // Redirect to verify email page after a short delay
      setTimeout(() => {
        navigate("/schoolchat/verify-email");
      }, 2000);
    } catch (error) {
      console.error("Erreur de régénération du token:", error);
      setActivationStatus("error");
      setRegenerationStatus("error");
      setErrorMessage(
        error.message || "Impossible de régénérer le token d'activation"
      );
    }
  };

  // Function to decode and validate the token
  const validateActivationToken = (token) => {
    try {
      // Decode the token
      const decodedToken = jwtDecode(token);

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        setIsTokenExpired(true);
        throw new Error("Le token d'activation a expiré");
      }

      // Extract email from the token
      const email = decodedToken.sub || decodedToken.email;
      if (!email) {
        throw new Error("Aucun email trouvé dans le token");
      }

      return { email, decodedToken };
    } catch (error) {
      console.error("Erreur de validation du token:", error);
      throw error;
    }
  };

  // Main activation function
  const activateAccount = async (token = urlActivationToken) => {
    // Ensure we have an activation token
    if (!token) {
      setActivationStatus("error");
      setErrorMessage("Aucun token d'activation fourni");
      return;
    }

    try {
      // Validate the token
      const { email } = validateActivationToken(token);
      setUserEmail(email);
      setActivationToken(token);

      // Send activation request to backend
      const apiUrl = `http://localhost:8486/scholchat/auth/activate?activationToken=${token}`;
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
          errorData?.message || "L'activation a échoué. Veuillez réessayer."
        );
      }

      // Store email in localStorage
      localStorage.setItem("userEmail", email);

      // Set success status
      setActivationStatus("success");

      // Start countdown for redirection
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/schoolchat/PasswordPage", {
              state: {
                activationToken: token,
                email: email,
              },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } catch (error) {
      console.error("Erreur d'activation:", error);
      setActivationStatus("error");
      setErrorMessage(
        error.message ||
          "Une erreur s'est produite lors de l'activation du compte."
      );
    }
  };

  useEffect(() => {
    // Call activation function
    if (urlActivationToken) {
      activateAccount(urlActivationToken);
    }
  }, [urlActivationToken]);

  return (
    <div className="activation-page">
      <div className="activation-container">
        <div className="logo-container">
          <img src={logoImage} alt="ScholChat Logo" className="logo" />
        </div>

        <div className="activation-content">
          <h1>Activation du compte</h1>

          {activationStatus === "loading" && (
            <div className="status-box loading">
              <Loader className="animate-spin" size={48} />
              <p>
                Veuillez patienter pendant que nous vérifions votre compte...
              </p>
            </div>
          )}

          {activationStatus === "success" && (
            <div className="status-box success">
              <Check className="icon" size={48} />
              <h2>Compte activé avec succès !</h2>
              <p>Votre compte a été vérifié et activé.</p>
              <p>
                Vous serez redirigé vers la page de mot de passe dans{" "}
                {countdown} secondes...
              </p>
              <button
                className="login-button"
                onClick={() =>
                  navigate("/schoolchat/PasswordPage", {
                    state: {
                      activationToken: activationToken,
                      email: userEmail,
                    },
                  })
                }
              >
                Définir le mot de passe maintenant
              </button>
            </div>
          )}

          {activationStatus === "error" && (
            <div className="status-box error">
              <AlertTriangle className="icon" size={48} />
              <h2>Échec de l'activation</h2>

              {isTokenExpired && !showEmailInput ? (
                <>
                  <p>Votre lien d'activation a expiré.</p>
                  <button
                    className="regenerate-button"
                    onClick={regenerateActivationToken}
                  >
                    Actualiser le token
                  </button>
                </>
              ) : (
                <>
                  {showEmailInput ? (
                    <div className="email-regeneration">
                      <p>
                        Veuillez saisir votre adresse e-mail pour régénérer le
                        token
                      </p>
                      <div className="input-group">
                        <div className="input-wrapper">
                          <Mail className="input-icon" size={20} />
                          <input
                            type="email"
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            placeholder="Entrez votre email"
                            required
                          />
                        </div>
                      </div>
                      <button
                        className="regenerate-button"
                        onClick={regenerateActivationToken}
                        disabled={!inputEmail}
                      >
                        Envoyer
                      </button>

                      {regenerationStatus === "success" && (
                        <p className="success-message">
                          Token régénéré avec succès. Redirection en cours...
                        </p>
                      )}
                      {regenerationStatus === "error" && (
                        <p className="error-message">
                          Échec de la régénération du token
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>{errorMessage}</p>
                      <div className="button-group">
                        <button
                          className="login-button"
                          onClick={() => navigate("/schoolchat/login")}
                        >
                          Aller à la connexion
                        </button>
                        <button
                          className="support-button"
                          onClick={() => navigate("/schoolchat/contact")}
                        >
                          Contacter le support
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 ScholChat. Tous droits réservés.</p>
          <div className="footer-links">
            <a href="/terms">Conditions d'utilisation</a>
            <a href="/privacy">Politique de confidentialité</a>
            <a href="/contact">Nous contacter</a>
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
          height: 200px;
          width: auto;
          max-width: 90%;
          object-fit: contain;
        }

        .activation-content {
          width: 100%;
          max-width: 600px;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          margin-top: 1rem;
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
        .support-button,
        .regenerate-button {
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

        .regenerate-button {
          background: #3b82f6;
          color: white;
        }

        .regenerate-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .regenerate-button:hover:not(:disabled) {
          background: #2563eb;
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

        .email-regeneration {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .input-group {
          width: 100%;
          margin-bottom: 1rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 40px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }

        .success-message {
          color: #2e7d32;
          margin-top: 1rem;
        }

        .error-message {
          color: #d32f2f;
          margin-top: 1rem;
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
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountActivation;
