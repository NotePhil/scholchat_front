import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faLock, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import {
  Alert,
  AuthShell,
  BrandLogo,
  BRAND_GRADIENT,
  Button,
  PasswordChecklist,
  PasswordField,
  passwordIsValid,
} from "../components/frontoffice/ui";
import {
  clearPendingPasswordChange,
  dashboardPathForRole,
  getPendingPasswordChange,
  requestLogin,
  storeLoginSession,
} from "../utils/loginSession";

/**
 * "Nouveau mot de passe" imposé à la première connexion (mot de passe temporaire envoyé par e-mail
 * après l'approbation de la classe) — design 26.jpg, étape 9.
 *
 * Deux entrées possibles :
 *  - depuis le formulaire de connexion (réponse login `mustChangePassword: true`) : le mot de passe
 *    temporaire et le jeton sont en mémoire (getPendingPasswordChange) ;
 *  - après un appel API refusé en 403 `MOT_DE_PASSE_A_CHANGER` : on réutilise le jeton de la session
 *    stockée et on redemande le mot de passe temporaire.
 * Appelle POST /auth/change-password {currentPassword, newPassword} (200, le même jeton reste valide),
 * puis ouvre le tableau de bord (reconnexion silencieuse quand on vient du formulaire de connexion).
 */
const ForcePasswordChange = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const pending = useMemo(() => getPendingPasswordChange(), []);

  const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  const token = pending?.authData?.accessToken || storedToken;
  const email = pending?.email || pending?.authData?.userEmail || localStorage.getItem("userEmail") || "";
  const selectedRole =
    pending?.authData?.selectedRole || (pending ? null : (localStorage.getItem("userRole") || "").replace(/^ROLE_/, "")) || null;
  const needsCurrentPassword = !pending?.tempPassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to change the password with: back to the login form
    if (!token) navigate("/schoolchat/login", { replace: true });
  }, [token, navigate]);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const current = needsCurrentPassword ? currentPassword : pending.tempPassword;
    if (needsCurrentPassword && !current) {
      setError("Saisissez le mot de passe temporaire reçu par e-mail.");
      return;
    }
    if (!passwordIsValid(password)) {
      setError("Le nouveau mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password === current) {
      setError("Le nouveau mot de passe doit être différent du mot de passe temporaire.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message ||
            (response.status === 401
              ? "Votre session a expiré. Reconnectez-vous avec votre mot de passe temporaire."
              : "Impossible de modifier le mot de passe."),
        );
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    clearPendingPasswordChange();

    // Came from a "403 MOT_DE_PASSE_A_CHANGER" while already logged in: the backend clears the flag
    // and the SAME token keeps working — just go back to the dashboard.
    if (!pending && localStorage.getItem("isAuthenticated") === "true" && storedToken) {
      try {
        const ar = JSON.parse(localStorage.getItem("authResponse") || "{}");
        localStorage.setItem("authResponse", JSON.stringify({ ...ar, mustChangePassword: false }));
      } catch {
        // ignore
      }
      window.location.href = dashboardPathForRole(localStorage.getItem("userRole"));
      return;
    }

    // From the login form: silent re-login with the new password so the normal login flow
    // (role selection, children, return page…) applies with a fresh session.
    try {
      const authData = await requestLogin({ email, password, ...(selectedRole ? { selectedRole } : {}) });
      const multiRoleChoiceNeeded =
        !selectedRole && authData.multiRole && Array.isArray(authData.availableRoles) && authData.availableRoles.length > 1;
      const target = !multiRoleChoiceNeeded && storeLoginSession(authData, { selectedRole, fallbackEmail: email, dispatch });
      if (target) {
        window.location.href = target;
        return;
      }
    } catch (err) {
      console.warn("Re-login after password change failed:", err);
      // The login token stays valid once the flag is cleared: use it.
      const pendingAuth = pending?.authData;
      const multi = pendingAuth?.multiRole && (pendingAuth.availableRoles || []).length > 1;
      const target =
        pendingAuth?.accessToken && !multi &&
        storeLoginSession({ ...pendingAuth, mustChangePassword: false }, { selectedRole, fallbackEmail: email, dispatch });
      if (target) {
        window.location.href = target;
        return;
      }
    }
    // Fallback: let the user log in with the new password
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAuthenticated");
    navigate("/schoolchat/login", {
      replace: true,
      state: { email, message: "Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe." },
    });
  };

  const handleCancel = () => {
    clearPendingPasswordChange();
    ["accessToken", "authToken", "refreshToken", "isAuthenticated"].forEach((k) => localStorage.removeItem(k));
  };

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto">
        <BrandLogo className="mb-8" />
        <div className="flex justify-center mb-6">
          <span className={`w-20 h-20 rounded-full ${BRAND_GRADIENT} text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30`}>
            <FontAwesomeIcon icon={faLock} />
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Nouveau mot de passe</h1>
        <p className="mt-2 text-center text-slate-500 dark:text-slate-400">
          Pour votre sécurité, choisissez un mot de passe personnel avant d'accéder à votre espace.
        </p>
        {email && (
          <p className="mt-1 text-center text-sm text-slate-400">
            Compte : <span className="font-medium text-slate-600 dark:text-slate-300">{email}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          {needsCurrentPassword && (
            <PasswordField
              label="Mot de passe temporaire"
              name="currentPassword"
              icon={faKey}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Reçu par e-mail"
              required
            />
          )}
          <PasswordField
            label="Nouveau mot de passe"
            name="newPassword"
            icon={faLock}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            required
          />
          <PasswordField
            label="Confirmer le mot de passe"
            name="confirmPassword"
            icon={faShieldHalved}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmez votre mot de passe"
            error={mismatch ? "Les mots de passe ne correspondent pas." : ""}
            required
          />
          <PasswordChecklist password={password} />
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            loadingLabel="Enregistrement…"
            disabled={!passwordIsValid(password) || password !== confirm}
          >
            Enregistrer le mot de passe
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/schoolchat/login" onClick={handleCancel} className="font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ForcePasswordChange;
