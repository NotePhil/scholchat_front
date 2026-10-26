import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faEnvelope,
  faKey,
  faPaperPlane,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Alert, AuthShell, BrandLogo, Button, StatusIcon, TextField } from "../components/frontoffice/ui";

/**
 * Activation link (/schoolchat/account-activation?activationToken=…), process unchanged:
 * POST /auth/activate?activationToken=… → set-password page (PasswordPage) with the token.
 * Expired / invalid link: a new link can be requested (POST /utilisateurs/regenerate-activation?email=…)
 * or the account verified with an e-mailed code (/schoolchat/verifier-compte).
 */
const AccountActivation = ({ theme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlActivationToken = new URLSearchParams(location.search).get("activationToken");
  const [activationStatus, setActivationStatus] = useState(urlActivationToken ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(urlActivationToken ? "" : "Aucun jeton d'activation fourni : le lien est incomplet.");
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState("");
  const [activationToken, setActivationToken] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationStatus, setRegenerationStatus] = useState("");
  const timerRef = useRef(null);

  const goToPasswordPage = (token, email) =>
    navigate("/schoolchat/PasswordPage", { state: { activationToken: token, email } });

  const regenerateActivationToken = async (e) => {
    e?.preventDefault();
    if (!inputEmail.trim()) {
      setShowEmailInput(true);
      return;
    }
    setRegenerating(true);
    setRegenerationStatus("");
    try {
      // The API reads the address from the "email" query parameter (@RequestParam), not a JSON body.
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/utilisateurs/regenerate-activation?email=${encodeURIComponent(inputEmail.trim())}`,
        { method: "POST", headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Échec de l'envoi d'un nouveau lien d'activation.");
      }
      setRegenerationStatus("success");
      setTimeout(() => navigate(`/schoolchat/verify-email?email=${encodeURIComponent(inputEmail.trim())}`), 2000);
    } catch (error) {
      setRegenerationStatus("error");
      setErrorMessage(error.message || "Impossible d'envoyer un nouveau lien d'activation.");
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!urlActivationToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const decodedToken = jwtDecode(urlActivationToken);
        const email = decodedToken.sub || decodedToken.email;
        if (!email) throw new Error("Lien d'activation invalide (aucune adresse e-mail).");
        setUserEmail(email);
        setInputEmail(email);
        setActivationToken(urlActivationToken);
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/auth/activate?activationToken=${urlActivationToken}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" },
        );
        if (cancelled) return;
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Already activated (PENDING / ACTIVE): go straight to the password page
          if (errorData?.message?.includes("PENDING") || errorData?.message?.includes("ACTIVE")) {
            setActivationStatus("success");
            goToPasswordPage(urlActivationToken, email);
            return;
          }
          throw new Error(errorData?.message || "L'activation a échoué. Veuillez réessayer.");
        }
        setActivationStatus("success");
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              goToPasswordPage(urlActivationToken, email);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        if (cancelled) return;
        setActivationStatus("error");
        setErrorMessage(
          error?.name === "InvalidTokenError"
            ? "Ce lien d'activation est invalide ou incomplet."
            : error.message || "Une erreur s'est produite lors de l'activation du compte.",
        );
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlActivationToken]);

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto text-center">
        <BrandLogo className="mb-8" />

        {activationStatus === "loading" && (
          <>
            <StatusIcon icon={faSpinner} spin />
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Activation en cours…</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Nous vérifions votre lien d'activation, un instant.</p>
          </>
        )}

        {activationStatus === "success" && (
          <>
            <StatusIcon icon={faCircleCheck} tone="success" />
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Compte activé !</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Il ne reste plus qu'à choisir votre mot de passe
              {userEmail ? (
                <>
                  {" "}
                  pour <strong className="text-slate-700 dark:text-slate-200">{userEmail}</strong>
                </>
              ) : null}
              .
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-[#4F46E5] dark:text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-ping" />
              Redirection dans {countdown} s…
            </p>
            <Button className="w-full mt-6" icon={faKey} onClick={() => goToPasswordPage(activationToken, userEmail)}>
              Définir mon mot de passe
            </Button>
          </>
        )}

        {activationStatus === "error" && (
          <>
            <StatusIcon icon={faTriangleExclamation} tone="error" />
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Lien expiré ou invalide</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Ce lien d'activation ne peut pas être utilisé. Demandez un nouveau lien ou vérifiez votre compte avec un code
              reçu par e-mail.
            </p>
            {errorMessage && regenerationStatus !== "success" && (
              <Alert type="error" className="mt-6 text-left">
                {errorMessage}
              </Alert>
            )}

            {showEmailInput ? (
              <form onSubmit={regenerateActivationToken} className="mt-6 space-y-4 text-left" noValidate>
                {regenerationStatus === "success" ? (
                  <Alert type="success">Un nouveau lien d'activation vient de vous être envoyé. Redirection…</Alert>
                ) : (
                  <>
                    <TextField
                      label="Votre adresse e-mail"
                      type="email"
                      name="email"
                      icon={faEnvelope}
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      autoComplete="email"
                      required
                    />
                    <Button type="submit" className="w-full" icon={faPaperPlane} loading={regenerating} loadingLabel="Envoi…" disabled={!inputEmail.trim()}>
                      Recevoir un nouveau lien
                    </Button>
                  </>
                )}
              </form>
            ) : (
              <div className="mt-6 grid gap-3">
                <Button icon={faPaperPlane} onClick={() => setShowEmailInput(true)}>
                  Recevoir un nouveau lien
                </Button>
                <Button
                  variant="secondary"
                  icon={faArrowRight}
                  to={`/schoolchat/verifier-compte${inputEmail ? `?email=${encodeURIComponent(inputEmail)}` : ""}`}
                >
                  Vérifier mon compte avec un code
                </Button>
              </div>
            )}
          </>
        )}

        <p className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/schoolchat/login" className="inline-flex items-center gap-2 font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à la connexion
          </Link>
          <Link to="/schoolchat/contact" className="font-medium text-slate-500 dark:text-slate-400 hover:underline">
            Contacter le support
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default AccountActivation;
