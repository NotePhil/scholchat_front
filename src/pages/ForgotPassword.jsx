import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope, faEnvelopeCircleCheck, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ForgotPasswordService from "../services/forgotPassword";
import { Alert, AuthShell, BrandLogo, BRAND_GRADIENT, Button, TextField } from "../components/frontoffice/ui";

/**
 * Mot de passe oublié — process unchanged: e-mail → lien de réinitialisation reçu par e-mail →
 * page /schoolchat/reset-password?token=…  (POST /auth/reset-password-request?email=…).
 */
const ForgotPassword = ({ theme }) => {
  const location = useLocation();
  // Prefilled from the sign-up ("Mot de passe oublié ?" under an already used e-mail).
  const [email, setEmail] = useState(() => new URLSearchParams(location.search).get("email") || location.state?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" | "confirmation"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ForgotPasswordService.requestPasswordReset(email.trim());
      setStep("confirmation");
    } catch (err) {
      console.error("Erreur lors de la demande:", err);
      setError(
        err?.response?.data?.message || "Erreur lors de l'envoi des instructions. Veuillez réessayer plus tard.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto">
        <BrandLogo className="mb-8" />
        <div className="flex justify-center mb-6">
          <span className={`w-20 h-20 rounded-full ${BRAND_GRADIENT} text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30`}>
            <FontAwesomeIcon icon={step === "request" ? faEnvelope : faEnvelopeCircleCheck} />
          </span>
        </div>

        {step === "request" ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Mot de passe oublié ?</h1>
            <p className="mt-2 text-center text-slate-500 dark:text-slate-400">
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {error && <Alert type="error">{error}</Alert>}
              <TextField
                label="Adresse e-mail"
                type="email"
                name="email"
                icon={faEnvelope}
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="exemple@email.com"
                required
              />
              <Button type="submit" className="w-full" loading={loading} loadingLabel="Envoi en cours…" icon={faPaperPlane}>
                Envoyer le lien
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Vérifiez votre e-mail</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Si un compte existe avec l'adresse <span className="font-semibold text-slate-800 dark:text-slate-100">{email}</span>, vous
              recevrez très prochainement un e-mail contenant un lien pour choisir un nouveau mot de passe.
            </p>
            <Alert type="warning" className="mt-6 text-left">
              Pensez à vérifier votre dossier <strong>Spam</strong> si vous ne recevez rien d'ici quelques minutes.
            </Alert>
            <Button variant="ghost" className="mt-6" onClick={() => setStep("request")}>
              Réessayer avec une autre adresse
            </Button>
          </div>
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

export default ForgotPassword;
