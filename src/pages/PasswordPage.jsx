import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck, faKey, faLock, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import {
  Alert,
  AuthShell,
  BrandLogo,
  Button,
  PasswordChecklist,
  PasswordField,
  StatusIcon,
  passwordIsValid,
} from "../components/frontoffice/ui";

/**
 * Choice of the password after the account activation (activation link → AccountActivation, or
 * e-mailed code → VerifyAccount). Router state: { email, activationToken }.
 * Process unchanged: POST /auth/registerPassword {email, passeAccess, type} with
 * Authorization: Bearer <activationToken>, then the login page.
 */
const PasswordPage = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.email || "";
  const activationToken = location.state?.activationToken || "";
  const [passeAccess, setPasseAccess] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(
    activationToken ? { text: "", type: "" } : { text: "Lien incomplet : aucun jeton d'activation trouvé.", type: "error" },
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!activationToken) return;
    if (!passwordIsValid(passeAccess)) {
      setMessage({ text: "Le mot de passe ne respecte pas tous les critères de sécurité.", type: "error" });
      return;
    }
    if (passeAccess !== confirmPassword) {
      setMessage({ text: "Les mots de passe ne correspondent pas.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/registerPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activationToken}` },
        body: JSON.stringify({ email: userEmail, passeAccess, type: "utilisateur" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec de la définition du mot de passe.");
      }
      localStorage.removeItem("userEmail");
      setSuccess(true);
      setTimeout(
        () =>
          navigate("/schoolchat/login", {
            replace: true,
            state: { email: userEmail, message: "Mot de passe enregistré : vous pouvez vous connecter." },
          }),
        2000,
      );
    } catch (error) {
      setMessage({ text: error.message || "Erreur lors de la définition du mot de passe.", type: "error" });
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
            <StatusIcon icon={faCircleCheck} tone="success" />
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Mot de passe enregistré</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Votre compte est prêt. Redirection vers la connexion…</p>
            <Button to="/schoolchat/login" state={{ email: userEmail }} className="mt-6">
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <StatusIcon icon={faLock} />
              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Choisissez votre mot de passe</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Dernière étape pour sécuriser votre compte.</p>
              {userEmail && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 break-all">
                  {userEmail}
                </p>
              )}
            </div>
            <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5" noValidate>
              {message.text && <Alert type={message.type || "error"}>{message.text}</Alert>}
              <PasswordField
                label="Nouveau mot de passe"
                name="password"
                icon={faKey}
                autoComplete="new-password"
                value={passeAccess}
                onChange={(e) => {
                  setPasseAccess(e.target.value);
                  if (message.type === "error" && activationToken) setMessage({ text: "", type: "" });
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
                placeholder="Répétez votre mot de passe"
                error={confirmPassword && passeAccess !== confirmPassword ? "Les mots de passe ne correspondent pas." : ""}
                required
              />
              <PasswordChecklist password={passeAccess} />
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                loadingLabel="Enregistrement…"
                disabled={!activationToken || !passwordIsValid(passeAccess) || passeAccess !== confirmPassword}
              >
                Valider mon mot de passe
              </Button>
            </form>
            {!activationToken && (
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Recevez un code de vérification pour reprendre l'activation :{" "}
                <Link to="/schoolchat/verifier-compte" className="font-semibold text-[#4F46E5] dark:text-indigo-300 hover:underline">
                  Vérifier mon compte
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

export default PasswordPage;
