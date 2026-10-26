import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faEnvelope,
  faPaperPlane,
  faPen,
  faRotateRight,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { Alert, AuthShell, BrandLogo, Button, StatusIcon, Stepper, TextField } from "../components/frontoffice/ui";

const API = process.env.REACT_APP_API_BASE_URL;
const CODE_LENGTH = 6;
const RESEND_DELAY = 60;

// Used only when the backend sends no `message`.
const ERROR_MESSAGES = {
  CODE_VERIFICATION_INVALIDE: "Code incorrect. Vérifiez les 6 chiffres reçus par e-mail.",
  CODE_VERIFICATION_EXPIRE: "Ce code a expiré. Demandez un nouveau code.",
  TROP_DE_TENTATIVES: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  COMPTE_NON_ELIGIBLE:
    "Ce compte ne peut pas encore être activé : il est toujours en attente de validation (par l'administration ou par le professeur de la classe). Vous recevrez un e-mail dès qu'il sera validé.",
};

const postJSON = async (path, body) => {
  let resp;
  try {
    resp = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    const err = new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
    err.code = "RESEAU";
    throw err;
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const code = String(data?.code || "").toUpperCase() || (resp.status === 429 ? "TROP_DE_TENTATIVES" : "");
    const err = new Error((typeof data?.message === "string" && data.message) || ERROR_MESSAGES[code] || "Une erreur est survenue. Réessayez.");
    err.code = code;
    err.status = resp.status;
    throw err;
  }
  return data;
};

/** Six one-digit boxes with paste / arrow / backspace support. */
const CodeInput = ({ value, onChange, disabled, invalid, onComplete }) => {
  const refs = useRef([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] || "");

  // Cleared after a wrong / expired code: back to the first box.
  useEffect(() => {
    if (!value && !disabled) refs.current[0]?.focus();
  }, [value, disabled]);

  const setDigits = (next, focusIndex) => {
    const joined = next.join("").slice(0, CODE_LENGTH);
    onChange(joined);
    if (focusIndex !== undefined) refs.current[Math.min(focusIndex, CODE_LENGTH - 1)]?.focus();
    if (joined.length === CODE_LENGTH && !next.includes("") && onComplete) onComplete(joined);
  };

  const handleChange = (i, raw) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    if (clean.length > 1) {
      // typed fast / autofill: spread from this box
      const next = [...digits];
      clean.split("").forEach((d, k) => {
        if (i + k < CODE_LENGTH) next[i + k] = d;
      });
      setDigits(next, i + clean.length);
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next, i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        setDigits(next, i);
      } else if (i > 0) {
        next[i - 1] = "";
        setDigits(next, i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, k) => pasted[k] || "");
    setDigits(next, pasted.length);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Code de vérification à 6 chiffres">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={CODE_LENGTH}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Chiffre ${i + 1}`}
          className={`sc-input w-11 h-14 sm:w-12 sm:h-14 rounded-xl border-2 bg-white dark:bg-slate-800 text-center text-2xl font-bold text-slate-900 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60 ${
            invalid ? "border-[#EF4444]" : d ? "border-[#4F46E5]" : "border-slate-200 dark:border-slate-600 focus:border-[#4F46E5]"
          }`}
        />
      ))}
    </div>
  );
};

/**
 * "Vérifier mon compte" (/schoolchat/verifier-compte[?email=…]) — activation by e-mailed code,
 * alternative to the activation link:
 *  1. e-mail → POST /auth/verification-compte/envoyer {email} (always 200, neutral answer);
 *  2. 6-digit code → POST /auth/verification-compte/verifier {email, code} → {activationToken, email}
 *     → set-password page (same as the activation link) → login.
 */
const VerifyAccount = ({ theme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(() => new URLSearchParams(location.search).get("email") || "");
  const [emailError, setEmailError] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState({ text: "", code: "" });
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const lastSubmitted = useRef("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    e?.preventDefault();
    const clean = email.trim();
    if (!/\S+@\S+\.\S+/.test(clean)) {
      setEmailError("Saisissez une adresse e-mail valide.");
      return;
    }
    setEmailError("");
    setError({ text: "", code: "" });
    setSending(true);
    try {
      await postJSON("/auth/verification-compte/envoyer", { email: clean });
      setStep(2);
      setCode("");
      lastSubmitted.current = "";
      setCooldown(RESEND_DELAY);
      setInfo(
        `Si un compte en attente d'activation correspond à ${clean}, un code à 6 chiffres vient de lui être envoyé. Pensez à vérifier le dossier Spam.`,
      );
    } catch (err) {
      setError({ text: err.message, code: err.code });
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (value = code) => {
    if (value.length !== CODE_LENGTH || verifying) return;
    lastSubmitted.current = value;
    setVerifying(true);
    setError({ text: "", code: "" });
    try {
      const data = await postJSON("/auth/verification-compte/verifier", { email: email.trim(), code: value });
      if (!data?.activationToken) throw new Error("Réponse inattendue du serveur. Réessayez.");
      navigate("/schoolchat/PasswordPage", {
        replace: true,
        state: { activationToken: data.activationToken, email: data.email || email.trim() },
      });
    } catch (err) {
      setError({ text: err.message, code: err.code });
      if (err.code === "CODE_VERIFICATION_INVALIDE" || err.code === "CODE_VERIFICATION_EXPIRE") setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const expired = error.code === "CODE_VERIFICATION_EXPIRE";
  const notEligible = error.code === "COMPTE_NON_ELIGIBLE";

  return (
    <AuthShell theme={theme}>
      <div className="max-w-md mx-auto">
        <BrandLogo className="mb-8" />
        <Stepper steps={["Adresse e-mail", "Code reçu", "Mot de passe"]} current={step} />

        {step === 1 && (
          <form onSubmit={sendCode} noValidate>
            <div className="text-center">
              <StatusIcon icon={faShieldHalved} />
              <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Vérifier mon compte</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Lien d'activation expiré ou introuvable ? Recevez un code à 6 chiffres par e-mail pour activer votre compte.
              </p>
            </div>
            <div className="mt-8 space-y-5">
              {error.text && <Alert type={error.code === "TROP_DE_TENTATIVES" ? "warning" : "error"}>{error.text}</Alert>}
              <TextField
                label="Adresse e-mail du compte"
                type="email"
                name="email"
                icon={faEnvelope}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="exemple@email.com"
                autoComplete="email"
                error={emailError}
                required
              />
              <Button type="submit" className="w-full" icon={faPaperPlane} loading={sending} loadingLabel="Envoi…" disabled={!email.trim()}>
                Recevoir un code
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCode();
            }}
            noValidate
          >
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Saisissez le code</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Code envoyé à <strong className="text-slate-800 dark:text-slate-100 break-all">{email.trim()}</strong>{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError({ text: "", code: "" });
                  }}
                  className="ml-1 inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] dark:text-indigo-300 hover:underline"
                >
                  <FontAwesomeIcon icon={faPen} className="text-xs" /> Modifier
                </button>
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {info && !error.text && <Alert type="info">{info}</Alert>}
              {error.text && (
                <Alert type={notEligible || error.code === "TROP_DE_TENTATIVES" ? "warning" : "error"}>
                  <p>{error.text}</p>
                  {/* e.g. account already active: go to login / forgotten password */}
                  {notEligible && (
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                      <Link to="/schoolchat/login" state={{ email: email.trim() }} className="underline">
                        Se connecter
                      </Link>
                      <Link to="/schoolchat/forgot-password" className="underline">
                        Mot de passe oublié ?
                      </Link>
                    </p>
                  )}
                </Alert>
              )}

              <CodeInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  if (error.text && !notEligible) setError({ text: "", code: "" });
                }}
                disabled={verifying || notEligible}
                invalid={error.code === "CODE_VERIFICATION_INVALIDE"}
                onComplete={(v) => {
                  if (v !== lastSubmitted.current) verifyCode(v);
                }}
              />

              <Button
                type="submit"
                className="w-full"
                icon={faArrowRight}
                loading={verifying}
                loadingLabel="Vérification…"
                disabled={code.length !== CODE_LENGTH || notEligible}
              >
                Vérifier le code
              </Button>

              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                {cooldown > 0 ? (
                  <span>
                    Renvoyer un code dans <strong className="tabular-nums text-slate-700 dark:text-slate-200">{cooldown} s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sending}
                    className={`inline-flex items-center gap-2 font-semibold hover:underline disabled:opacity-60 ${
                      expired ? "text-[#EF4444]" : "text-[#4F46E5] dark:text-indigo-300"
                    }`}
                  >
                    <FontAwesomeIcon icon={faRotateRight} spin={sending} />
                    {expired ? "Recevoir un nouveau code" : "Renvoyer le code"}
                  </button>
                )}
              </div>
            </div>
          </form>
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

export default VerifyAccount;
