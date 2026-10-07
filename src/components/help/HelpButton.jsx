import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion,
  faLightbulb,
  faListCheck,
  faQuestion,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { HELP_ROLE_LABELS, getHelp, listHelpTopics } from "../../help/helpContent";

/** Modal showing the guidelines of one page for one role (texts: src/help/helpContent.js). */
export const HelpModal = ({ open, onClose, role, page, isDark = false }) => {
  const [currentPage, setCurrentPage] = useState(page);
  useEffect(() => {
    if (open) setCurrentPage(page);
  }, [open, page]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const help = getHelp(role, currentPage);
  if (!open || !help) return null;
  const topics = listHelpTopics(role);
  const card = isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-900";
  const muted = isDark ? "text-slate-300" : "text-slate-600";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className={`${card} w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 p-5 pb-4 bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] text-white">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-white/20 flex items-center justify-center text-lg">
            <FontAwesomeIcon icon={faCircleQuestion} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">Aide · {HELP_ROLE_LABELS[role]}</p>
            <h2 id="help-modal-title" className="text-lg font-bold leading-tight">
              {help.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full hover:bg-white/20 flex items-center justify-center"
            aria-label="Fermer l'aide"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className={`text-sm leading-relaxed ${muted}`}>{help.intro}</p>

          {help.steps?.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2">
                <FontAwesomeIcon icon={faListCheck} className="text-[#4F46E5]" /> Comment faire
              </h3>
              <ol className="space-y-2">
                {help.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-[#4F46E5] text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className={`pt-0.5 ${muted}`}>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {help.tips?.length > 0 && (
            <section className={`rounded-2xl p-4 ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}>
              <h3 className="flex items-center gap-2 text-sm font-bold mb-2 text-amber-600">
                <FontAwesomeIcon icon={faLightbulb} /> Astuces
              </h3>
              <ul className="space-y-1.5 list-disc pl-5">
                {help.tips.map((tip) => (
                  <li key={tip} className={`text-sm ${muted}`}>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topics.length > 1 && (
            <section>
              <label htmlFor="help-topic" className="block text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">
                Autres rubriques d'aide
              </label>
              <select
                id="help-topic"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}
              >
                {topics.map((t) => (
                  <option key={t.key} value={t.page}>
                    {t.title}
                  </option>
                ))}
              </select>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * Round "?" button placed at the same spot on every page (dashboard header, top right);
 * renders nothing when there is no help text for this role + page.
 */
const HelpButton = ({ role, page, isDark = false, className = "" }) => {
  const [open, setOpen] = useState(false);
  if (!getHelp(role, page)) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#4F46E5] to-[#8C52FF] text-white shadow-md hover:shadow-lg hover:brightness-110 transition ${className}`}
        title="Aide sur cette page"
        aria-label="Aide sur cette page"
        aria-haspopup="dialog"
      >
        <FontAwesomeIcon icon={faQuestion} style={{ fontSize: 15 }} />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} role={role} page={page} isDark={isDark} />
    </>
  );
};

export default HelpButton;
