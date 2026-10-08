import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck, faLock, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import ForgotPasswordService from "../services/forgotPassword";
import { useTranslation } from "../hooks/useTranslation";
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

/**
 * Réinitialisation du mot de passe depuis le lien reçu par e-mail
 * (/schoolchat/reset-password?token=…) — process unchanged: POST /auth/reset-password {token, newPassword}.
 */
const ResetPassword = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    localStorage.clear();
    const tokenParam = new URLSearchParams(location.search).get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage({
        text: t("forgot_password.invalid_link", "Lien de réinitialisation invalide ou expiré."),
        type: "error",
      });
    }
  }, [location.search, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage({ text: t("forgot_password.invalid_token", "Lien de réinitialisation invalide."), type: "error" });
      return;
    }
    if (!passwordIsValid(password)) {
      setMessage({
        text: t("forgot_password.password_weak", "Le mot de passe ne respecte pas les critères de sécurité."),
        type: "error",
      });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: t("forgot_password.password_mismatch", "Les mots de passe ne correspondent pas."), type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const result = await ForgotPasswordService.resetPassword({ token, password });
      if (!result) throw new Error("Échec de la réinitialisation.");
      localStorage.clear();
      setSuccess(true);
      setTimeout(() => navigate("/schoolchat/login", { replace: true }), 3000);
    } catch (err) {
      setMessage({
        text:
          err?.response?.data?.message ||
          t("forgot_password.reset_error", "Une erreur s'est produite. Veuillez réessayer."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto">
        <BrandLogo className="mb-8" />
        {success ? (
          <div className="text-center">
            <span className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[#10B981] flex items-center justify-center text-4xl">
              <FontAwesomeIcon icon={faCircleCheck} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Mot de passe réinitialisé</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {t("forgot_password.reset_success", "Votre mot de passe a été réinitialisé avec succès !")} Redirection vers la
              connexion…
            </p>
            <Button to="/schoolchat/login" className="mt-6">
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <span className={`w-20 h-20 rounded-full ${BRAND_GRADIENT} text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30`}>
                <FontAwesomeIcon icon={faLock} />
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Nouveau mot de passe</h1>
            <p className="mt-2 text-center text-slate-500 dark:text-slate-400">Choisissez un mot de passe sécurisé.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {message.text && <Alert type={message.type || "error"}>{message.text}</Alert>}
              <PasswordField
                label="Nouveau mot de passe"
                name="password"
                icon={faLock}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (message.type === "error" && token) setMessage({ text: "", type: "" });
                }}
                placeholder="Minimum 8 caractères"
                required
              />
              <PasswordField
                label="Confirmer le mot de passe"
                name="confirmPassword"
                icon={faShieldHalved}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                error={confirmPassword && password !== confirmPassword ? "Les mots de passe ne correspondent pas." : ""}
                required
              />
              <PasswordChecklist password={password} />
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                loadingLabel="Réinitialisation…"
                disabled={!token || !passwordIsValid(password) || password !== confirmPassword}
              >
                Réinitialiser le mot de passe
              </Button>
            </form>
            {!token && (
              <p className="mt-4 text-center text-sm">
                <Link to="/schoolchat/forgot-password" className="font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
                  Demander un nouveau lien
                </Link>
              </p>
            )}
          </>
        )}
        <p className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link to="/schoolchat/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à la connexion
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ResetPassword;
