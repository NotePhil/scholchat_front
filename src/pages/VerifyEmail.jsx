import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faEnvelopeOpenText, faKey, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Alert, AuthShell, BrandLogo, Button, StatusIcon } from "../components/frontoffice/ui";

/**
 * "Vérifiez votre e-mail" (/schoolchat/verify-email?email=…) — shown after a sign-up / a new
 * activation link. Process unchanged: "Renvoyer l'e-mail" → POST /utilisateurs/regenerate-activation?email=…
 * (not for a professor, whose account is first validated by the administration).
 */
const VerifyEmail = ({ theme }) => {
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email") || "";
  const [userType] = useState(() => localStorage.getItem("userType") || "");
  const isProfessor = userType === "professeur";
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleResendVerification = async () => {
    if (isResending || !email || isProfessor) return;
    setIsResending(true);
    setMessage({ text: "", type: "" });
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/utilisateurs/regenerate-activation?email=${encodeURIComponent(email)}`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec de l'envoi de l'e-mail de vérification.");
      }
      setMessage({ text: "L'e-mail a été renvoyé. Consultez votre boîte de réception (et le dossier Spam).", type: "success" });
    } catch (err) {
      setMessage({ text: err.message || "Échec de l'envoi de l'e-mail. Veuillez réessayer.", type: "error" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto text-center">
        <BrandLogo className="mb-8" />
        <StatusIcon icon={faEnvelopeOpenText} />
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Vérifiez votre e-mail</h1>
        {email && (
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Nous avons envoyé un e-mail à <strong className="text-slate-800 dark:text-slate-100 break-all">{email}</strong>.
          </p>
        )}
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {isProfessor
            ? "Votre demande de compte professeur a bien été reçue. Elle va être vérifiée par l'administration : vous recevrez ensuite un e-mail pour activer votre compte."
            : "Suivez les instructions qu'il contient pour activer votre compte. Vous ne le voyez pas ? Vérifiez votre dossier Spam."}
        </p>

        {message.text && (
          <Alert type={message.type} className="mt-6 text-left">
            {message.text}
          </Alert>
        )}

        <div className="mt-8 grid gap-3">
          <Button to="/schoolchat/login" icon={faArrowRight}>
            Aller à la connexion
          </Button>
          {!isProfessor && email && (
            <Button variant="secondary" icon={faPaperPlane} onClick={handleResendVerification} loading={isResending} loadingLabel="Envoi en cours…">
              Renvoyer l'e-mail
            </Button>
          )}
          {!isProfessor && (
            <Button
              variant="ghost"
              icon={faKey}
              to={`/schoolchat/verifier-compte${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            >
              Vérifier avec un code reçu par e-mail
            </Button>
          )}
        </div>

        <p className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à l'accueil
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
