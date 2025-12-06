import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, AlertTriangle, Loader, Mail } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "../hooks/useTranslation";
import logoImage from "../components/assets/images/logo.png";

const AccountActivation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

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

  const regenerateActivationToken = async () => {
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
      setRegenerationStatus("success");

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

  const activateAccount = async (token = urlActivationToken) => {
    if (!token) {
      setActivationStatus("error");
      setErrorMessage("Aucun token d'activation fourni");
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const email = decodedToken.sub || decodedToken.email;
      if (!email) {
        throw new Error("Aucun email trouvé dans le token");
      }
      setUserEmail(email);
      setActivationToken(token);

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

      setActivationStatus("success");
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
          <h1>{t("pages.accountActivation.title")}</h1>

          {activationStatus === "loading" && (
            <div className="status-box loading">
              <Loader className="animate-spin" size={48} />
              <p>{t("pages.accountActivation.loading")}</p>
            </div>
          )}

          {activationStatus === "success" && (
            <div className="status-box success">
              <Check className="icon" size={48} />
              <h2>{t("pages.accountActivation.success.title")}</h2>
              <p>{t("pages.accountActivation.success.message")}</p>
              <p>
                {t("pages.accountActivation.success.redirect", { countdown })}
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
                {t("pages.accountActivation.success.setPassword")}
              </button>
            </div>
          )}

          {activationStatus === "error" && (
            <div className="status-box error">
              <AlertTriangle className="icon" size={48} />
              <h2>{t("pages.accountActivation.error.title")}</h2>

              {isTokenExpired || showEmailInput ? (
                <div className="email-regeneration">
                  <p>{t("pages.accountActivation.error.regeneratePrompt")}</p>
                  <div className="input-group">
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={20} />
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder={t("pages.accountActivation.error.emailPlaceholder")}
                        required
                      />
                    </div>
                  </div>
                  <button
                    className="regenerate-button"
                    onClick={regenerateActivationToken}
                    disabled={!inputEmail}
                  >
                    {t("pages.accountActivation.error.send")}
                  </button>

                  {regenerationStatus === "success" && (
                    <p className="success-message">
                      {t("pages.accountActivation.error.regenerateSuccess")}
                    </p>
                  )}
                  {regenerationStatus === "error" && (
                    <p className="error-message">
                      {t("pages.accountActivation.error.regenerateError")}
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
                      {t("pages.accountActivation.error.goToLogin")}
                    </button>
                    <button
                      className="support-button"
                      onClick={() => navigate("/schoolchat/contact")}
                    >
                      {t("pages.accountActivation.error.contactSupport")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/terms">{t("pages.accountActivation.footer.terms")}</a>
            <a href="/privacy">{t("pages.accountActivation.footer.privacy")}</a>
            <a href="/contact">{t("pages.accountActivation.footer.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccountActivation;