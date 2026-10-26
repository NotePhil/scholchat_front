import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faEye,
  faEyeSlash,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import "../../CSS/frontoffice.css";

/*
 * Shared building blocks for the public "front office" pages (landing, connexion,
 * inscription, mot de passe…), following the ScholChat design sheets:
 * palette #8C52FF / #4F46E5 / #3B82F6 / #10B981 / #F59E0B / #EF4444 / #64748B / #E2E8F0, Poppins.
 */

export const BRAND_GRADIENT = "bg-gradient-to-r from-[#4F46E5] to-[#8C52FF]";

let logoIdSeq = 0;

/**
 * ScholChat logo mark — same drawing as the mobile app (scholchat_mobile/src/components/brand/Logo.tsx)
 * and the installed app icon: gradient speech-bubble square, white graduation cap, tassel on the right.
 * variant "gradient": gradient square + white cap; "white": white square + gradient cap.
 */
export const LogoMark = ({ size = 40, variant = "gradient", className = "" }) => {
  const [gradId] = useState(() => `scg-${++logoIdSeq}`);
  const grad = `url(#${gradId})`;
  const squareFill = variant === "gradient" ? grad : "#FFFFFF";
  const glyphFill = variant === "gradient" ? "#FFFFFF" : grad;
  return (
    <svg
      width={size}
      height={size * 1.08}
      viewBox="0 0 100 108"
      role="img"
      aria-label="ScholChat"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="88" rx="24" ry="24" fill={squareFill} />
      <polygon points="25,86 26.5,101 42,89" fill={squareFill} strokeLinejoin="round" />
      <polygon points="16,39 50,23 84,39 50,55" fill={glyphFill} />
      <polygon points="30,48 50,58 70,48 70,63 50,71 30,63" fill={glyphFill} />
      <line x1="51" y1="39" x2="75" y2="47" stroke={squareFill} strokeWidth="3.2" />
      <line x1="75" y1="47" x2="75" y2="66" stroke={glyphFill} strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="47" r="1.8" fill={glyphFill} />
      <circle cx="75" cy="68.5" r="3" fill={glyphFill} />
    </svg>
  );
};

/** Logo mark + "ScholChat" wordmark (+ optional tagline). */
export const BrandLogo = ({ size = "md", withName = true, tagline = false, className = "" }) => {
  const mark = size === "lg" ? 56 : size === "sm" ? 32 : 40;
  const name = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={mark} />
      {withName && (
        <span className="flex flex-col leading-tight">
          <span className={`${name} font-bold text-slate-900 dark:text-white tracking-tight`}>ScholChat</span>
          {tagline && (
            <span className="text-xs font-medium text-[#4F46E5] dark:text-indigo-300">L'école connectée, partout.</span>
          )}
        </span>
      )}
    </span>
  );
};

/** Primary (gradient) or secondary (outlined) button; renders a Link when `to` is given. */
export const Button = ({
  variant = "primary",
  loading = false,
  loadingLabel,
  children,
  className = "",
  to,
  icon,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm sm:text-base transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: `${BRAND_GRADIENT} text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110`,
    secondary:
      "border-2 border-solid border-[#4F46E5] text-[#4F46E5] bg-white hover:bg-indigo-50 dark:bg-transparent dark:text-indigo-300 dark:border-indigo-400 dark:hover:bg-indigo-500/10",
    ghost: "text-[#4F46E5] hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10",
    subtle:
      "border border-solid border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700",
  };
  const content = loading ? (
    <>
      <FontAwesomeIcon icon={faSpinner} spin />
      <span>{loadingLabel || children}</span>
    </>
  ) : (
    <>
      {children}
      {icon && <FontAwesomeIcon icon={icon} />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={`${base} ${styles[variant]} ${className}`} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button {...props} className={`${base} ${styles[variant]} ${className}`} disabled={loading || props.disabled}>
      {content}
    </button>
  );
};

const inputBase =
  "sc-input block w-full rounded-xl border bg-white dark:bg-slate-800 py-3 text-sm sm:text-base placeholder-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-[#4F46E5]";

/** Labelled input with optional leading icon, error and hint. */
export const TextField = ({ label, required, icon, error, hint, className = "", inputClassName = "", ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
      <input
        id={props.id || props.name}
        className={`${inputBase} ${icon ? "pl-11" : "pl-4"} pr-4 ${
          error ? "border-[#EF4444]" : "border-slate-200 dark:border-slate-600"
        } ${inputClassName}`}
        aria-invalid={!!error}
        {...props}
      />
    </div>
    {typeof error === "string" && error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

/** Password input with show/hide toggle. */
export const PasswordField = ({ label, required, icon, error, hint, className = "", ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
            <FontAwesomeIcon icon={icon} />
          </span>
        )}
        <input
          id={props.id || props.name}
          type={visible ? "text" : "password"}
          className={`${inputBase} ${icon ? "pl-11" : "pl-4"} pr-12 ${
            error ? "border-[#EF4444]" : "border-slate-200 dark:border-slate-600"
          }`}
          aria-invalid={!!error}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
        </button>
      </div>
      {typeof error === "string" && error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
};

/** Inline message banner. */
export const Alert = ({ type = "error", children, className = "" }) => {
  if (!children) return null;
  const map = {
    error: ["bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300", faCircleExclamation],
    success: ["bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300", faCircleCheck],
    warning: ["bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300", faTriangleExclamation],
    info: ["bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-200", faCircleInfo],
  };
  const [cls, icon] = map[type] || map.error;
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${cls} ${className}`}>
      <FontAwesomeIcon icon={icon} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

/** Horizontal numbered stepper ("1 Infos perso — 2 Classe / Code — 3 Confirmation"). */
export const Stepper = ({ steps, current }) => (
  <ol className="flex items-start w-full mb-8" aria-label="Étapes">
    {steps.map((label, idx) => {
      const n = idx + 1;
      const done = current > n;
      const active = current === n;
      return (
        <li key={label} className={`flex items-start ${idx < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center min-w-[64px]">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                done || active
                  ? `${BRAND_GRADIENT} text-white shadow-md shadow-indigo-500/30`
                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <FontAwesomeIcon icon={faCheck} /> : n}
            </span>
            <span
              className={`mt-1.5 text-[11px] sm:text-xs text-center leading-tight ${
                active ? "text-[#4F46E5] dark:text-indigo-300 font-semibold" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mt-4 mx-1 rounded ${done ? "bg-[#8C52FF]" : "bg-slate-200 dark:bg-slate-700"}`} />
          )}
        </li>
      );
    })}
  </ol>
);

/** Password policy (identical to the backend PasswordPolicy / POST /auth/change-password). */
export const PASSWORD_RULES = [
  { key: "length", label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { key: "uppercase", label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
  { key: "lowercase", label: "Une lettre minuscule", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "Un chiffre", test: (p) => /\d/.test(p) },
  { key: "special", label: "Un caractère spécial (!@#$…)", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export const passwordIsValid = (p) => PASSWORD_RULES.every((r) => r.test(p || ""));

export const PasswordChecklist = ({ password }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4">
    {PASSWORD_RULES.map((rule) => {
      const ok = rule.test(password || "");
      return (
        <li key={rule.key} className="flex items-center gap-2 text-xs">
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
              ok ? "bg-[#10B981] text-white" : "bg-slate-200 text-transparent dark:bg-slate-600"
            }`}
          >
            <FontAwesomeIcon icon={faCheck} />
          </span>
          <span className={ok ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400"}>{rule.label}</span>
        </li>
      );
    })}
  </ul>
);

/**
 * Centered auth layout: a white card with the form, and (on large screens) an illustration
 * panel on the right — mirrors the "Connexion" / "Inscription" cards of the design sheet.
 */
export const AuthShell = ({ illustration, illustrationAlt = "", aside, children, wide = false, theme }) => (
  <div className={`${theme === "dark" ? "dark" : ""}`}>
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-24 pb-12 px-4 sm:px-6">
      <div
        className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-4xl"} bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden grid ${
          illustration || aside ? "lg:grid-cols-[1.1fr_0.9fr]" : ""
        }`}
      >
        <div className="p-6 sm:p-10">{children}</div>
        {(illustration || aside) && (
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-800 dark:to-indigo-950 p-10">
            {illustration && <img src={illustration} alt={illustrationAlt} className="w-full max-w-sm object-contain select-none" draggable={false} />}
            {aside}
          </div>
        )}
      </div>
    </div>
  </div>
);

/** Big round status icon for confirmation / status pages (activation, e-mail envoyé, lien expiré…). */
export const StatusIcon = ({ icon, tone = "brand", spin = false, className = "" }) => {
  const tones = {
    brand: `${BRAND_GRADIENT} text-white shadow-xl shadow-indigo-500/30`,
    success: "bg-emerald-50 text-[#10B981] dark:bg-emerald-500/10",
    error: "bg-red-50 text-[#EF4444] dark:bg-red-500/10",
    warning: "bg-amber-50 text-[#F59E0B] dark:bg-amber-500/10",
    neutral: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-3xl ${tones[tone] || tones.brand} ${className}`}>
      <FontAwesomeIcon icon={icon} spin={spin} />
    </span>
  );
};
