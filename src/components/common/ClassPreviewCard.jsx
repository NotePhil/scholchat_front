import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faChalkboardUser,
  faCircleCheck,
  faLayerGroup,
  faSchool,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Card describing the class found for a code (GET /public/classes/apercu).
 * `title` defaults to "Classe trouvée"; pass e.g. "Vous rejoignez" on a confirmation step.
 */
export const ClassPreviewCard = ({ preview, title = "Classe trouvée", className = "", compact = false }) => {
  if (!preview) return null;
  const rows = [
    { icon: faLayerGroup, label: "Niveau", value: preview.niveau },
    { icon: faBuildingColumns, label: "Établissement", value: preview.etablissementNom },
    { icon: faChalkboardUser, label: "Professeur", value: preview.professeurNom },
  ].filter((r) => r.value);
  return (
    <div
      className={`rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10 ${compact ? "p-3" : "p-4"} ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        <FontAwesomeIcon icon={faCircleCheck} />
        {title}
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#8C52FF] text-white flex items-center justify-center text-lg shadow">
          <FontAwesomeIcon icon={faSchool} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900 dark:text-white break-words">{preview.nom || "Classe"}</p>
          {rows.length > 0 && (
            <dl className="mt-1 space-y-0.5">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                  <FontAwesomeIcon icon={r.icon} className="w-3.5 text-slate-400 shrink-0" />
                  <dt className="sr-only">{r.label}</dt>
                  <dd className="truncate">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

/** Small status line under a code field: loading / error. */
export const ClassPreviewStatus = ({ status, error }) => {
  if (status === "loading") {
    return (
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" role="status">
        <FontAwesomeIcon icon={faSpinner} spin /> Recherche de la classe…
      </p>
    );
  }
  if (status === "error" && error) {
    return (
      <p className="mt-2 text-sm text-[#EF4444]" role="alert">
        {error}
      </p>
    );
  }
  return null;
};

export default ClassPreviewCard;
