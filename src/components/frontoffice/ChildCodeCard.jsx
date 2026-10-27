import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChild,
  faEnvelope,
  faKey,
  faMagnifyingGlass,
  faTrashCan,
  faUser,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import { Button, TextField } from "./ui";
import { ClassPreviewCard, ClassPreviewStatus } from "../common/ClassPreviewCard";
import { useClassPreview } from "../../hooks/useClassPreview";
import { normalizeClassCode } from "../../services/classePreview";

/**
 * One child of a parent: prénom, nom and the class code, checked with « Vérifier le code »
 * (GET /public/classes/apercu?type=parent) → class card. Used by the parent sign-up and by
 * « Mes enfants » (add a child / join another class with showNames=false).
 *
 * value: { prenom, nom, codeClasse }; onChange(field, value); onPreviewChange(preview | null) is called
 * whenever the verified class changes. errors: { prenom, nom, codeClasse, general } (strings).
 * allowAdult: shows the choice « Mineur (sans compte) » / « Majeur — a (ou aura) son propre compte »
 * (value.type: "MINEUR" | "MAJEUR", onChange("type", …)). An adult child is identified by the e-mail of his
 * existing student account (value.email) and the code(s) of the class(es) to follow (value.codesClasse: string[],
 * onChange("codesClasse", […]), at least one): he must already have his account and be a member of each class;
 * the professor of each class validates the follow. adultEmailLocked hides the e-mail (« Suivre une autre
 * classe » of a known child). errors.email / errors.codesClasse (strings). errors.suggestAdult (with errors.general, e.g.
 * ELEVE_EXISTE_AVEC_COMPTE) shows « Ajouter avec son e-mail », which switches the card to « Majeur ».
 * verifiedPreview: class already verified for this code (kept by the parent while the card was unmounted,
 * e.g. when coming back from the summary step). resetKey: changing it clears the verified class (e.g. the
 * backend refused the code) — the parent clears its verifiedPreview too.
 */
const ChildCodeCard = ({
  index = 0,
  title,
  value,
  onChange,
  onPreviewChange,
  errors = {},
  onRemove,
  showNames = true,
  disabled = false,
  resetKey,
  verifiedPreview = null,
  idPrefix = "enfant",
  className = "",
  allowAdult = false,
  adultEmailLocked = false,
}) => {
  const adult = (allowAdult || adultEmailLocked) && value.type === "MAJEUR";
  const codes = Array.isArray(value.codesClasse) && value.codesClasse.length ? value.codesClasse : [""];
  const setCode = (i, v) => onChange("codesClasse", codes.map((c, k) => (k === i ? v : c)));
  const preview = useClassPreview(value.codeClasse, adult ? "eleve" : "parent");
  const { isValid, preview: found, reset } = preview;
  const clean = normalizeClassCode(value.codeClasse);
  const stored = verifiedPreview && verifiedPreview.code === clean ? verifiedPreview : null;
  const current = isValid ? found : preview.status === "idle" ? stored : null;
  const reported = useRef(undefined);

  useEffect(() => {
    const key = current ? `${current.id}|${current.code}` : null;
    if (reported.current === key) return;
    reported.current = key;
    onPreviewChange?.(current);
  }, [current, onPreviewChange]);

  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    reset();
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const id = (name) => `${idPrefix}-${index}-${name}`;
  const codeError =
    preview.status === "error" ? preview.error || true : typeof errors.codeClasse === "string" ? errors.codeClasse : undefined;

  return (
    <div
      className={`rounded-2xl border ${
        errors.general ? "border-[#EF4444]" : "border-slate-200 dark:border-slate-700"
      } bg-white dark:bg-slate-800/60 p-4 sm:p-5 ${className}`}
    >
      {(title || onRemove) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && (
            <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-[#10B981] flex items-center justify-center">
                <FontAwesomeIcon icon={faChild} />
              </span>
              {title}
            </p>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] hover:underline disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrashCan} /> Retirer
            </button>
          )}
        </div>
      )}
      {allowAdult && showNames && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4" role="radiogroup" aria-label="Type d'inscription">
          {[
            { type: "MINEUR", icon: faChild, label: "Mineur (sans compte)", hint: "Vous agissez pour lui" },
            { type: "MAJEUR", icon: faUserGraduate, label: "Majeur", hint: "A déjà son propre compte élève" },
          ].map((opt) => {
            const active = (value.type || "MINEUR") === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => !active && onChange("type", opt.type)}
                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                  active
                    ? "border-[#4F46E5] bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-600 hover:border-indigo-300"
                }`}
              >
                <FontAwesomeIcon icon={opt.icon} className={`mt-0.5 ${active ? "text-[#4F46E5]" : "text-slate-400"}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{opt.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {errors.general && (
        <div className="mb-3" role="alert">
          <p className="text-sm text-[#EF4444]">{errors.general}</p>
          {allowAdult && errors.suggestAdult && !adult && (
            <Button
              type="button"
              variant="secondary"
              className="mt-2 !py-2"
              onClick={() => onChange("type", "MAJEUR")}
              disabled={disabled}
            >
              <FontAwesomeIcon icon={faEnvelope} /> Ajouter avec son e-mail
            </Button>
          )}
        </div>
      )}
      {adult && (
        <div className="mb-4">
          {!adultEmailLocked && (
          <TextField
            id={id("email")}
            type="email"
            label="E-mail de votre enfant"
            required
            icon={faEnvelope}
            value={value.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="adresse@exemple.com"
            error={errors.email}
            hint="L'adresse de son compte élève ScholChat."
            disabled={disabled}
            autoComplete="off"
          />
          )}
          <div className={adultEmailLocked ? "" : "mt-4"}>
            <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Code{codes.length > 1 ? "s" : ""} de la classe à suivre <span className="text-[#EF4444]">*</span>
            </p>
            <div className="space-y-2">
              {codes.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextField
                    id={id(`code-majeur-${i}`)}
                    className="flex-1"
                    icon={faKey}
                    value={code}
                    onChange={(e) => setCode(i, e.target.value)}
                    placeholder="Ex. 123456"
                    disabled={disabled}
                    autoComplete="off"
                    aria-label={`Code de classe ${i + 1}`}
                    inputClassName="tracking-wider font-semibold"
                  />
                  {codes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onChange("codesClasse", codes.filter((_, k) => k !== i))}
                      disabled={disabled}
                      className="p-2 text-slate-400 hover:text-[#EF4444]"
                      aria-label={`Retirer le code ${i + 1}`}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {typeof errors.codesClasse === "string" && (
              <p className="mt-1.5 text-sm text-[#EF4444]" role="alert">{errors.codesClasse}</p>
            )}
            {codes.length < 10 && (
              <button
                type="button"
                onClick={() => onChange("codesClasse", [...codes, ""])}
                disabled={disabled}
                className="mt-2 text-xs font-semibold text-[#4F46E5] hover:underline disabled:opacity-50"
              >
                + Ajouter un autre code de classe
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Votre enfant majeur doit déjà avoir son compte élève et être inscrit dans chaque classe indiquée. Le
            professeur de chaque classe valide votre demande ; vous suivrez alors cette classe en lecture seule.
          </p>
        </div>
      )}
      {showNames && !adult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <TextField
            id={id("prenom")}
            label="Prénom"
            required
            icon={faUser}
            value={value.prenom}
            onChange={(e) => onChange("prenom", e.target.value)}
            placeholder="Prénom de l'enfant"
            error={errors.prenom}
            disabled={disabled}
            autoComplete="off"
          />
          <TextField
            id={id("nom")}
            label="Nom"
            required
            icon={faUser}
            value={value.nom}
            onChange={(e) => onChange("nom", e.target.value)}
            placeholder="Nom de l'enfant"
            error={errors.nom}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      )}
      {!adult && (
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <TextField
          id={id("code")}
          className="flex-1"
          label="Code de la classe"
          required
          icon={faKey}
          value={value.codeClasse}
          onChange={(e) => onChange("codeClasse", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              preview.verify();
            }
          }}
          placeholder="Ex. 123456"
          error={codeError}
          hint={preview.status === "idle" ? "Code fourni par le professeur ou l'établissement" : undefined}
          disabled={disabled}
          autoComplete="off"
          inputClassName={`tracking-wider font-semibold ${current ? "!border-[#10B981]" : ""}`}
        />
        {!current && (
          <Button
            type="button"
            variant="secondary"
            className="sm:mt-[30px] !py-2.5"
            onClick={() => preview.verify()}
            disabled={disabled || !String(value.codeClasse || "").trim()}
            loading={preview.status === "loading"}
            loadingLabel="Vérification…"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} /> Vérifier le code
          </Button>
        )}
      </div>
      )}
      {!adult && preview.status === "loading" && <ClassPreviewStatus status="loading" />}
      {!adult && current && <ClassPreviewCard preview={current} className="mt-4" compact />}
    </div>
  );
};

export default ChildCodeCard;
