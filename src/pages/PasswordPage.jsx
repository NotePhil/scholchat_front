import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
const PasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [passeAccess, setPasseAccess] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activationToken, setActivationToken] = useState("");
  useEffect(() => {
    if (location.state) {
      const { email, activationToken } = location.state;
      if (email) {
        setUserEmail(email);
      }
      if (activationToken) {
        setActivationToken(activationToken);
      }
    } else {
      showAlert("Aucun email ou token trouvé. Veuillez vous réinscrire.");
    }
  }, [location.state]);
  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (passeAccess.length < 8) {
      showAlert("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }
    if (passeAccess !== confirmPassword) {
      showAlert("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    const hasUppercase = /[A-Z]/.test(passeAccess);
    const hasLowercase = /[a-z]/.test(passeAccess);
    const hasNumber = /[0-9]/.test(passeAccess);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passeAccess);
    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecialChar)) {
      showAlert("Mot de passe trop faible. Utilisez des caractères variés.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/auth/registerPassword`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activationToken}`,
          },
          body: JSON.stringify({
            email: userEmail,
            passeAccess: passeAccess,
            type: "utilisateur",
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Échec de la définition du mot de passe",
        );
      }
      showAlert("Mot de passe défini avec succès !", "success");
      localStorage.removeItem("userEmail");
      setTimeout(() => {
        navigate("/schoolchat/login", {
          replace: true,
        });
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      showAlert(
        error.message || "Erreur lors de la définition du mot de passe",
      );
      setLoading(false);
    }
  };
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {alertMessage && (
        <div className={`fixed top-8 right-8 z-50 animate-fade-in-down`}>
          <div
            className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${alertType === "success" ? "bg-green-50/90 border-green-200 text-green-800" : "bg-red-50/90 border-red-200 text-red-800"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${alertType === "success" ? "bg-green-100" : "bg-red-100"}`}
            >
              {alertType === "success" ? (
                <FontAwesomeIcon
                  icon={faCheck}
                  style={{
                    fontSize: 20,
                  }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  style={{
                    fontSize: 20,
                  }}
                />
              )}
            </div>
            <p className="font-bold">{alertMessage}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg relative z-10 animate-fade-in-down">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute -top-10 -right-10 w-48 h-48 rotate-12"
              />
            </div>

            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto ring-8 ring-white/10">
                <FontAwesomeIcon
                  icon={faLock}
                  className="text-white"
                  style={{
                    fontSize: 48,
                  }}
                />
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">
              Sécurisez votre compte
            </h2>
            <p className="text-blue-100 font-medium opacity-80">
              Définissez un mot de passe robuste pour protéger vos données
            </p>
          </div>

          <div className="p-10 sm:p-12">
            {userEmail && (
              <div className="mb-10 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm font-semibold text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  {userEmail}
                </span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-8">
              {/* Password Field */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">
                  Nouveau mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <FontAwesomeIcon
                      icon={faKey}
                      style={{
                        fontSize: 22,
                      }}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passeAccess}
                    onChange={(e) => setPasseAccess(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-14 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-900 font-medium text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <FontAwesomeIcon
                        icon={faEyeSlash}
                        style={{
                          fontSize: 22,
                        }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faEye}
                        style={{
                          fontSize: 22,
                        }}
                      />
                    )}
                  </button>
                </div>

                {/* Requirements Indicator */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Requirement
                    met={passeAccess.length >= 8}
                    text="8+ caractères"
                  />
                  <Requirement
                    met={/[A-Z]/.test(passeAccess)}
                    text="Majuscule"
                  />
                  <Requirement met={/[0-9]/.test(passeAccess)} text="Chiffre" />
                  <Requirement
                    met={/[!@#$%^&*(),.?":{}|<>]/.test(passeAccess)}
                    text="Spécial"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                      style={{
                        fontSize: 22,
                      }}
                    />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez votre mot de passe"
                    className={`w-full pl-14 pr-14 py-4 border rounded-2xl focus:ring-4 transition-all outline-none text-gray-900 font-medium text-lg ${confirmPassword && passeAccess !== confirmPassword ? "bg-red-50 border-red-200 focus:ring-red-500/10 focus:border-red-500" : "bg-gray-50 border-gray-200 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <FontAwesomeIcon
                        icon={faEyeSlash}
                        style={{
                          fontSize: 22,
                        }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faEye}
                        style={{
                          fontSize: 22,
                        }}
                      />
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword === passeAccess && (
                  <p className="text-green-600 text-xs font-bold flex items-center gap-1 ml-4 animate-bounce">
                    <FontAwesomeIcon
                      icon={faCheck}
                      style={{
                        fontSize: 14,
                      }}
                    />{" "}
                    Les mots de passe correspondent
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    "Valider mon profil"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-8 font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} ScholChat. Sécurité renforcée par
          SSL.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};
const Requirement = ({ met, text }) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-500 border ${met ? "bg-green-50 border-green-100 text-green-700 font-bold scale-100" : "bg-gray-50 border-gray-100 text-gray-400 scale-95 opacity-60"}`}
  >
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? "bg-green-500 text-white" : "bg-gray-200"}`}
    >
      <FontAwesomeIcon
        icon={faCheck}
        style={{
          fontSize: 10,
        }}
      />
    </div>
    <span className="text-[10px] uppercase tracking-tighter">{text}</span>
  </div>
);
export default PasswordPage;
