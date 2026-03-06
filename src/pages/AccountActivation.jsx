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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-fade-in-up">
          {/* Header Section */}
          <div className="p-10 pb-0 text-center relative">
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl">
                <img src={logoImage} alt="ScholChat" className="h-16 w-auto" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              {activationStatus === "loading" ? "Vérification en cours" : t("pages.accountActivation.title")}
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full mb-8"></div>
          </div>

          <div className="p-10 pt-0">
            {/* Loading Status */}
            {activationStatus === "loading" && (
              <div className="text-center py-12 space-y-8 animate-fade-in">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-6 bg-blue-500/20 rounded-full animate-pulse flex items-center justify-center">
                      <Loader className="text-blue-400 animate-pulse" size={24} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white/90">Protocoles de sécurité</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-[240px] mx-auto italic">
                    {t("pages.accountActivation.loading")}
                  </p>
                </div>
              </div>
            )}

            {/* Success Status */}
            {activationStatus === "success" && (
              <div className="text-center py-8 space-y-8 animate-scale-in">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Check className="text-emerald-400" size={48} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-white leading-tight">Succès !</h2>
                    <p className="text-white/60 text-lg font-medium">{t("pages.accountActivation.success.message")}</p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 inline-flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                    <p className="text-blue-400 font-medium text-sm">
                      {t("pages.accountActivation.success.redirect", { countdown })}
                    </p>
                  </div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:translate-y-0"
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

            {/* Error Status */}
            {activationStatus === "error" && (
              <div className="py-8 space-y-8 animate-fade-in">
                <div className="text-center">
                  <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                    <AlertTriangle className="text-rose-400" size={44} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 underline decoration-rose-500/30 underline-offset-8 decoration-4">
                    {t("pages.accountActivation.error.title")}
                  </h2>
                </div>

                {isTokenExpired || showEmailInput ? (
                  <div className="space-y-6">
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-xl">
                      <p className="text-amber-200 text-sm font-medium leading-relaxed">
                        {t("pages.accountActivation.error.regeneratePrompt")}
                      </p>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                        <Mail size={22} />
                      </div>
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder={t("pages.accountActivation.error.emailPlaceholder")}
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/10 transition-all outline-none text-white font-medium placeholder:text-white/20"
                        required
                      />
                    </div>
                    <button
                      className="w-full bg-white text-slate-900 py-4 px-8 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:grayscale"
                      onClick={regenerateActivationToken}
                      disabled={!inputEmail}
                    >
                      {t("pages.accountActivation.error.send")}
                    </button>

                    {regenerationStatus === "success" && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-bounce">
                        <Check className="text-emerald-400 flex-shrink-0" size={20} />
                        <p className="text-emerald-200 text-sm font-semibold">
                          {t("pages.accountActivation.error.regenerateSuccess")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20">
                      <p className="text-rose-200 text-center font-medium leading-relaxed">{errorMessage}</p>
                    </div>
                    <div className="grid gap-4">
                      <button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
                        onClick={() => navigate("/schoolchat/login")}
                      >
                        {t("pages.accountActivation.error.goToLogin")}
                      </button>
                      <button
                        className="w-full bg-white/5 border border-white/10 text-white/70 py-4 px-8 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
                        onClick={() => navigate("/schoolchat/contact")}
                      >
                        {t("pages.accountActivation.error.contactSupport")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-6 text-white/40 text-sm font-medium">
            <a href="/terms" className="hover:text-white transition-colors">{t("pages.accountActivation.footer.terms")}</a>
            <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
            <a href="/privacy" className="hover:text-white transition-colors">{t("pages.accountActivation.footer.privacy")}</a>
            <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
            <a href="/contact" className="hover:text-white transition-colors">{t("pages.accountActivation.footer.contact")}</a>
          </div>
          <p className="text-white/20 text-[10px] mt-6 font-bold tracking-[0.2em] uppercase">
            &copy; {new Date().getFullYear()} ScholChat &bull; Advanced Learning Platform
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AccountActivation;