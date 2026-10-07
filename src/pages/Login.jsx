import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faEnvelope, faLock, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../hooks/useTranslation";
import RoleSelectorModal from "../components/modals/RoleSelectorModal";
import ChildSelectorModal from "../components/modals/ChildSelectorModal";
import { Alert, AuthShell, BrandLogo, Button, PasswordField, TextField } from "../components/frontoffice/ui";
import {
  FORCED_PASSWORD_PATH,
  requestLogin,
  setPendingPasswordChange,
  storeLoginSession,
} from "../utils/loginSession";
import loginHero from "../assets/illustrations/login-hero.png";
import loginHeroDark from "../assets/illustrations/login-hero-dark.png";

const AUTH_KEYS = [
  "accessToken",
  "refreshToken",
  "authToken",
  "isAuthenticated",
  "userId",
  "userRole",
  "userEmail",
  "username",
  "userRoles",
  "decodedToken",
  "authResponse",
];

export const Login = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState("");
  // 403 COMPTE_EN_ATTENTE_APPROBATION: account created with a class code, teacher approval pending
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  // Multi-role state
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableChildren, setAvailableChildren] = useState([]);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [infoMessage] = useState(location.state?.message || "");
  // true uniquement quand TOUTES les classes/établissements de l'utilisateur ont une offre expirée
  // (plus aucun accès actif) — voir AuthBusiness.loginUser. Sinon la connexion se fait normalement.
  const [offreExpireeBlocked, setOffreExpireeBlocked] = useState(false);

  useEffect(() => {
    // Session expiry message — stored in sessionStorage so localStorage cleanup can't erase it
    if (sessionStorage.getItem("sessionExpired") === "true") {
      setSessionExpiredMessage("Votre session a expiré. Veuillez vous reconnecter.");
      sessionStorage.removeItem("sessionExpired");
    }
  }, []);

  useEffect(() => {
    const returnToPage = localStorage.getItem("returnToPage");
    // Only wipe auth data if there's no token already present (avoids clearing a freshly-written session on redirect)
    if (!localStorage.getItem("accessToken")) {
      ["rememberedEmail", ...AUTH_KEYS, "loginTime"].forEach((k) => localStorage.removeItem(k));
      if (returnToPage) localStorage.setItem("returnToPage", returnToPage);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (pendingApproval) setPendingApproval(false);
  };

  const completeLogin = (authData, selectedRole = null) => {
    // Si l'utilisateur a encore au moins une classe/établissement actif, le backend laisse toujours
    // passer la connexion (voir AuthBusiness.loginUser). authData.expiredEntities (si présent) est
    // conservé pour un avertissement ciblé dans le tableau de bord (OffreInfoPanel).
    const target = storeLoginSession(authData, { selectedRole, fallbackEmail: formData.email, dispatch });
    if (!target) {
      setError(t("auth.errors.invalidToken"));
      setLoading(false);
      return;
    }
    localStorage.removeItem("returnToPage");
    window.location.href = target;
  };

  /** First login with a temporary password: forced "Nouveau mot de passe" before anything else. */
  const goToForcedPasswordChange = (authData) => {
    setPendingPasswordChange({
      email: formData.email.trim(),
      // kept in memory only, sent as currentPassword to POST /auth/change-password
      tempPassword: formData.password,
      authData,
    });
    navigate(FORCED_PASSWORD_PATH);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSessionExpiredMessage("");
    setOffreExpireeBlocked(false);
    setPendingApproval(false);

    let navigatingAway = false;
    try {
      const authData = await requestLogin({ email: formData.email.trim(), password: formData.password });

      if (authData.mustChangePassword) {
        navigatingAway = true;
        goToForcedPasswordChange(authData);
        return;
      }
      if (!authData.accessToken) throw new Error(t("auth.errors.missingToken"));

      // Multiple roles — show the role picker
      if (authData.multiRole && authData.availableRoles && authData.availableRoles.length > 1) {
        setPendingAuthData(authData);
        setAvailableRoles(authData.availableRoles);
        setShowRoleSelector(true);
        return;
      }

      navigatingAway = true;
      completeLogin(authData);
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "ABONNEMENT_EXPIRE") setOffreExpireeBlocked(true);
      setPendingApproval(err.code === "COMPTE_EN_ATTENTE_APPROBATION");
      setError(err.message || t("auth.errors.invalidCredentials"));
      AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } finally {
      if (!navigatingAway) setLoading(false);
    }
  };

  const handleRoleSelected = async (role) => {
    setShowRoleSelector(false);
    if (!pendingAuthData) return;
    try {
      setLoading(true);
      // Re-login with the selected role
      const newAuthData = await requestLogin({
        email: formData.email.trim(),
        password: formData.password,
        selectedRole: role,
      });
      if (newAuthData.mustChangePassword) {
        goToForcedPasswordChange(newAuthData);
        return;
      }
      // Parent with several children
      if (role === "PARENT" && newAuthData.children && newAuthData.children.length > 1) {
        setPendingAuthData(newAuthData);
        setAvailableChildren(newAuthData.children);
        setShowChildSelector(true);
        setLoading(false);
        return;
      }
      completeLogin(newAuthData, role);
    } catch (err) {
      // e.g. offer expired for the professor profile, or a profile awaiting validation
      if (err.code === "ABONNEMENT_EXPIRE") setOffreExpireeBlocked(true);
      setError(err.message || "Impossible de se connecter avec ce profil.");
      setLoading(false);
    }
  };

  const handleChildSelected = (child) => {
    setShowChildSelector(false);
    if (child) {
      localStorage.setItem("selectedChildId", child.id);
      localStorage.setItem("selectedChildName", `${child.prenom} ${child.nom}`);
    }
    if (pendingAuthData) completeLogin(pendingAuthData, "PARENT");
  };

  return (
    <>
      <RoleSelectorModal
        isOpen={showRoleSelector}
        roles={availableRoles}
        pendingRoles={pendingAuthData?.pendingRoles || []}
        onSelect={handleRoleSelected}
        onClose={() => setShowRoleSelector(false)}
      />
      <ChildSelectorModal
        isOpen={showChildSelector}
        children={availableChildren}
        onSelect={handleChildSelected}
        onClose={() => {
          setShowChildSelector(false);
          if (pendingAuthData) completeLogin(pendingAuthData, "PARENT");
        }}
      />

      <AuthShell
        theme={theme}
        illustration={theme === "dark" ? loginHeroDark : loginHero}
        illustrationAlt="Élèves qui apprennent ensemble"
        aside={
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 dark:text-white">L'école connectée, partout.</p>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Le même compte sur le web et sur l'application mobile.</p>
          </div>
        }
      >
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <BrandLogo className="mb-8" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Connexion</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {infoMessage && !error && <Alert type="success">{infoMessage}</Alert>}
            {sessionExpiredMessage && <Alert type="warning">{sessionExpiredMessage}</Alert>}
            {error && (
              <Alert type={pendingApproval ? "warning" : "error"}>
                <p>{error}</p>
                {offreExpireeBlocked && (
                  <button
                    type="button"
                    onClick={() => navigate("/schoolchat/renouveler-offre")}
                    className="mt-2 w-full py-2 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white text-sm font-semibold"
                  >
                    Renouveler mon compte
                  </button>
                )}
              </Alert>
            )}

            <TextField
              label={t("auth.login.email")}
              type="email"
              name="email"
              icon={faEnvelope}
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemple@email.com"
              required
            />
            <PasswordField
              label={t("auth.login.password")}
              name="password"
              icon={faLock}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mot de passe"
              required
            />
            <div className="flex justify-end -mt-2">
              <Link to="/schoolchat/forgot-password" className="text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={loading} loadingLabel={t("auth.login.signingIn")} icon={faArrowRight}>
              {t("auth.login.signIn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Pas encore de compte ?{" "}
            <Link to="/schoolchat/signup" className="font-semibold text-[#4F46E5] dark:text-indigo-300 hover:underline">
              Créer un compte
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">
            Première connexion ? Utilisez le mot de passe temporaire reçu par e-mail : il vous sera demandé de le changer.
          </p>
          {/* Activation by e-mailed code (lien d'activation expiré / introuvable) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <Button
              variant="subtle"
              to={`/schoolchat/verifier-compte${formData.email ? `?email=${encodeURIComponent(formData.email.trim())}` : ""}`}
              className="w-full sm:w-auto !py-2.5"
            >
              <FontAwesomeIcon icon={faShieldHalved} /> Vérifier mon compte ?
            </Button>
            <p className="mt-2 text-xs text-slate-400">Compte pas encore activé ? Recevez un code de vérification par e-mail.</p>
          </div>
        </motion.div>
      </AuthShell>
    </>
  );
};

export default Login;
