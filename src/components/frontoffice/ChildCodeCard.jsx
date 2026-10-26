import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faKey, faMagnifyingGlass, faTrashCan, faUser } from "@fortawesome/free-solid-svg-icons";
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
}) => {
  const preview = useClassPreview(value.codeClasse, "parent");
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
      {errors.general && (
        <p className="mb-3 text-sm text-[#EF4444]" role="alert">
          {errors.general}
        </p>
      )}
      {showNames && (
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
      {preview.status === "loading" && <ClassPreviewStatus status="loading" />}
      {current && <ClassPreviewCard preview={current} className="mt-4" compact />}
    </div>
  );
};

export default ChildCodeCard;
