import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReturnToPage } from "../hooks/useReturnToPage";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { encryptPassword } from "../utils/crypto";
import { useTranslation } from "../hooks/useTranslation";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import RoleSelectorModal from "../components/modals/RoleSelectorModal";
import ChildSelectorModal from "../components/modals/ChildSelectorModal";

const decodeJWT = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const rawPayload = atob(base64);
    const jsonPayload = decodeURIComponent(
      rawPayload
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const decodedToken = JSON.parse(jsonPayload);
    return decodedToken;
  } catch (error) {
    return null;
  }
};

export const Login = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { navigateToStoredPage: _unused } = useReturnToPage();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Multi-role state
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableChildren, setAvailableChildren] = useState([]);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  // true uniquement quand TOUTES les classes/établissements de l'utilisateur ont une offre expirée
  // (plus aucun accès actif) — voir AuthBusiness.loginUser. Sinon la connexion se fait normalement.
  const [offreExpireeBlocked, setOffreExpireeBlocked] = useState(false);

  useEffect(() => {
    // Check for session expiry message — stored in sessionStorage so localStorage cleanup can't erase it
    const sessionExpired = sessionStorage.getItem("sessionExpired");
    if (sessionExpired === "true") {
      setSessionExpiredMessage("Votre session a expiré. Veuillez vous reconnecter.");
      sessionStorage.removeItem("sessionExpired");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setOffreExpireeBlocked(false);

    let loginSucceeded = false;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: encryptPassword(formData.password),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "ABONNEMENT_EXPIRE") {
          setOffreExpireeBlocked(true);
        }
        throw new Error(
          errorData.message || t("auth.errors.authenticationFailed")
        );
      }

      const authData = await response.json();
      const accessToken = authData.accessToken;
      const refreshToken = authData.refreshToken;

      if (!accessToken) {
        throw new Error(t("auth.errors.missingToken"));
      }

      // Check if user has multiple roles - show role picker
      if (authData.multiRole && authData.availableRoles && authData.availableRoles.length > 1) {
        setPendingAuthData(authData);
        setAvailableRoles(authData.availableRoles);
        setShowRoleSelector(true);
        setLoading(false);
        return; // Wait for role selection
      }

      // Single role - proceed directly
      completeLogin(authData);
      loginSucceeded = true;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t("auth.errors.invalidCredentials"));

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("username");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("decodedToken");
      localStorage.removeItem("authResponse");
    } finally {
      // Only reset loading on error - on success we're navigating away
      if (!loginSucceeded) {
        setLoading(false);
      }
    }
  };

  const completeLogin = (authData, selectedRole = null) => {
    // Si l'utilisateur a encore au moins une classe/établissement actif, le backend laisse toujours
    // passer la connexion (voir AuthBusiness.loginUser) — on ne l'interrompt donc jamais ici.
    // authData.expiredEntities (si présent) liste uniquement les entités concrètement expirées ;
    // on le garde en mémoire pour afficher un avertissement ciblé quand l'utilisateur ouvre
    // spécifiquement cette classe/cet établissement (voir OffreInfoPanel), pas au login.
    const accessToken = authData.accessToken;
    const decodedToken = decodeJWT(accessToken);
    if (!decodedToken) return;

    const userId = authData.userId;
    const userEmail = authData.userEmail || decodedToken.email || formData.email;
    const username = authData.username || decodedToken.username || userEmail.split("@")[0];

    if (!userId || userId.includes("@")) return;

    // Use selected role or the one from auth response
    const roleStr = selectedRole || authData.selectedRole || null;
    const activeRole = roleStr
      ? (roleStr.toUpperCase().startsWith("ROLE_") ? roleStr.toUpperCase() : "ROLE_" + roleStr.toUpperCase())
      : null;

    let userRoles = [];
    let primaryRole = activeRole;

    if (Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0) {
      userRoles = decodedToken.roles;
      if (!primaryRole) {
        primaryRole = decodedToken.roles.length > 1 ? decodedToken.roles[1] : decodedToken.roles[0];
      }
    }

    const returnToPage = localStorage.getItem("returnToPage");
    localStorage.clear();
    if (returnToPage) localStorage.setItem("returnToPage", returnToPage);

    const user = {
      name: username, email: userEmail, username, phone: "", id: userId,
    };

    localStorage.setItem("accessToken", accessToken);
    if (authData.refreshToken) localStorage.setItem("refreshToken", authData.refreshToken);
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("userRole", primaryRole);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("username", username);
    localStorage.setItem("userName", username);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("loginTime", new Date().getTime().toString());
    localStorage.setItem("userRoles", JSON.stringify(userRoles));
    localStorage.setItem("decodedToken", JSON.stringify(decodedToken));
    localStorage.setItem("authResponse", JSON.stringify(authData));
    if (authData.availableRoles) {
      localStorage.setItem("availableRoles", JSON.stringify(authData.availableRoles));
    }
    if (authData.children) {
      localStorage.setItem("children", JSON.stringify(authData.children));
    }
    if (Array.isArray(authData.expiredEntities) && authData.expiredEntities.length > 0) {
      localStorage.setItem("expiredOfferEntities", JSON.stringify(authData.expiredEntities));
    } else {
      localStorage.removeItem("expiredOfferEntities");
    }

    dispatch(setCredentials({ token: accessToken, user, userRole: primaryRole, userRoles }));
    window.dispatchEvent(new Event("storage"));

    // Navigate to dashboard
    const rolePathMap = {
      "ROLE_ADMIN": "/schoolchat/Principal/AdminDashboard/activities",
      "ROLE_PROFESSOR": "/schoolchat/Principal/ProfessorDashboard/activities",
      "ROLE_PARENT": "/schoolchat/Principal/ParentDashboard/activities",
      "ROLE_STUDENT": "/schoolchat/Principal/StudentDashboard/activities",
      "ROLE_TUTOR": "/schoolchat/Principal/ProfessorDashboard/activities",
      "ROLE_GESTIONNAIRE": "/schoolchat/Principal/GestionnaireDashboard/activities",
    };
    const dashboardPath = rolePathMap[primaryRole] || rolePathMap["ROLE_ADMIN"];

    // Check for a stored return page that matches this role's dashboard
    const expectedDashboardType = dashboardPath.split("/")[3];
    if (returnToPage && returnToPage.toLowerCase().includes('/schoolchat/principal') && returnToPage.includes(expectedDashboardType)) {
      localStorage.removeItem("returnToPage");
      window.location.href = returnToPage;
    } else {
      localStorage.removeItem("returnToPage");
      window.location.href = dashboardPath;
    }
  };

  const handleRoleSelected = async (role) => {
    setShowRoleSelector(false);
    if (!pendingAuthData) return;

    // Re-login with selected role
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: encryptPassword(formData.password),
          selectedRole: role,
        }),
      });
      if (!response.ok) throw new Error("Role switch failed");
      const newAuthData = await response.json();

      // Check if parent with multiple children
      if (role === "PARENT" && newAuthData.children && newAuthData.children.length > 1) {
        setPendingAuthData(newAuthData);
        setAvailableChildren(newAuthData.children);
        setShowChildSelector(true);
        setLoading(false);
        return;
      }

      completeLogin(newAuthData, role);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChildSelected = (child) => {
    setShowChildSelector(false);
    if (child) {
      localStorage.setItem("selectedChildId", child.id);
      localStorage.setItem("selectedChildName", `${child.prenom} ${child.nom}`);
    }
    if (pendingAuthData) {
      completeLogin(pendingAuthData, "PARENT");
    }
  };

  useEffect(() => {
    const returnToPage = localStorage.getItem("returnToPage");
    const existingToken = localStorage.getItem("accessToken");
    // Only wipe auth data if there's no valid token already present
    // (avoids clearing a freshly-written session on redirect)
    if (!existingToken) {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("username");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("decodedToken");
      localStorage.removeItem("authResponse");
      localStorage.removeItem("loginTime");
      // Note: do NOT touch sessionStorage here — sessionExpired flag lives there
      if (returnToPage) {
        localStorage.setItem("returnToPage", returnToPage);
      }
    }
  }, []);

  return (
    <>
    {/* Role Selection Modal */}
    <RoleSelectorModal
      isOpen={showRoleSelector}
      roles={availableRoles}
      onSelect={handleRoleSelected}
      onClose={() => setShowRoleSelector(false)}
    />

    {/* Child Selection Modal */}
    <ChildSelectorModal
      isOpen={showChildSelector}
      children={availableChildren}
      onSelect={handleChildSelected}
      onClose={() => { setShowChildSelector(false); if (pendingAuthData) completeLogin(pendingAuthData, "PARENT"); }}
    />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900 dark' : 'bg-gray-50'
      }`}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t("auth.login.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("auth.login.subtitle")}{" "}
            <button
              onClick={() => navigate("/schoolchat/signup")}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t("auth.login.createAccount")}
            </button>
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || sessionExpiredMessage) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border px-4 py-3 rounded-xl text-sm ${
                  sessionExpiredMessage
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}
              >
                <p>{sessionExpiredMessage || error}</p>
                {offreExpireeBlocked && (
                  <button
                    type="button"
                    onClick={() => navigate("/schoolchat/renouveler-offre")}
                    className="mt-2 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                  >
                    Renouveler mon compte
                  </button>
                )}
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.login.email")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.login.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a
                href="/schoolchat/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t("auth.login.forgotPassword")}
              </a>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 font-semibold text-base"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t("auth.login.signingIn")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.login.signIn")}</span>
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            {t("auth.login.termsPrefix")}{" "}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t("auth.login.termsLink")}
            </a>{" "}
            {t("auth.login.termsAnd")}{" "}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t("auth.login.privacyLink")}
            </a>
          </div>
        </motion.div>
      </div>
      </div>
    </motion.div>
    </>
  );
};

export default Login;
