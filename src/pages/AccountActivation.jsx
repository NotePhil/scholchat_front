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
        `${process.env.REACT_APP_API_BASE_URL}/utilisateurs/regenerate-activation`,
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

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/auth/activate?activationToken=${token}`;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <img src={logoImage} alt="ScholChat Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t("pages.accountActivation.title")}</h1>
          </div>

          <div className="p-8">
            {activationStatus === "loading" && (
              <div className="text-center py-8">
                <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                <p className="text-gray-600 text-lg">{t("pages.accountActivation.loading")}</p>
              </div>
            )}

            {activationStatus === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("pages.accountActivation.success.title")}</h2>
                <p className="text-gray-600 mb-4">{t("pages.accountActivation.success.message")}</p>
                <p className="text-sm text-gray-500 mb-6">
                  {t("pages.accountActivation.success.redirect", { countdown })}
                </p>
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              <div className="py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t("pages.accountActivation.error.title")}</h2>

                {isTokenExpired || showEmailInput ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-center">{t("pages.accountActivation.error.regeneratePrompt")}</p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder={t("pages.accountActivation.error.emailPlaceholder")}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={regenerateActivationToken}
                      disabled={!inputEmail}
                    >
                      {t("pages.accountActivation.error.send")}
                    </button>

                    {regenerationStatus === "success" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 text-sm text-center">
                          {t("pages.accountActivation.error.regenerateSuccess")}
                        </p>
                      </div>
                    )}
                    {regenerationStatus === "error" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700 text-sm text-center">
                          {t("pages.accountActivation.error.regenerateError")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
                    <div className="space-y-3">
                      <button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        onClick={() => navigate("/schoolchat/login")}
                      >
                        {t("pages.accountActivation.error.goToLogin")}
                      </button>
                      <button
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
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

        <footer className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-sm">
            <a href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">{t("pages.accountActivation.footer.terms")}</a>
            <a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">{t("pages.accountActivation.footer.privacy")}</a>
            <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">{t("pages.accountActivation.footer.contact")}</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AccountActivation;