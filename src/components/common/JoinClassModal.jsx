import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faKey,
  faMagnifyingGlass,
  faRightToBracket,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useClassPreview } from "../../hooks/useClassPreview";
import { ClassPreviewCard } from "./ClassPreviewCard";

/**
 * "Rejoindre une classe" — step 1: the user types the class code; the class is looked up
 * (GET /public/classes/apercu) only when the single button "Vérifier le code" is clicked, and shown before
 * anything is sent. Once found, the button becomes "Continuer" and hands the preview to the caller (which
 * opens the access-request confirmation). Editing the code hides the class again.
 * type: "parent" (request for a child) | "eleve".
 */
const JoinClassModal = ({ open, onClose, type = "eleve", onContinue, initialCode = "" }) => {
  const [code, setCode] = useState(initialCode);
  const preview = useClassPreview(code, type, { enabled: open });

  useEffect(() => {
    if (!open) setCode(initialCode || "");
  }, [open, initialCode]);

  const handleContinue = async () => {
    if (!preview.isValid) {
      await preview.verify();
      return;
    }
    if (onContinue) onContinue(preview.preview);
  };
  const loading = preview.status === "loading";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      destroyOnHidden
      title={
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faRightToBracket} />
          </span>
          <div>
            <div className="font-bold text-[15px] text-slate-800">Rejoindre une classe</div>
            <div className="text-xs font-normal text-slate-400">
              {type === "parent" ? "Code de la classe de votre enfant" : "Code fourni par votre professeur"}
            </div>
          </div>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
        className="pt-2"
      >
        <label htmlFor="join-class-code" className="block text-sm font-medium text-slate-700 mb-1.5">
          Code de la classe
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <FontAwesomeIcon icon={faKey} />
          </span>
          <input
            id="join-class-code"
            autoFocus
            autoComplete="off"
            inputMode="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex. 123456"
            className={`w-full rounded-xl border-2 bg-white py-2.5 pl-10 pr-3 text-base font-semibold tracking-wider outline-none transition focus:ring-4 focus:ring-indigo-500/15 ${
              preview.status === "error"
                ? "border-red-300 focus:border-red-400"
                : preview.isValid
                  ? "border-emerald-400"
                  : "border-slate-200 focus:border-indigo-500"
            }`}
            aria-invalid={preview.status === "error"}
            aria-describedby="join-class-help"
          />
        </div>

        <div id="join-class-help" className="min-h-[1.25rem]">
          {preview.status === "loading" && <p className="mt-2 text-sm text-slate-500">Recherche de la classe…</p>}
          {preview.status === "error" && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {preview.error}
            </p>
          )}
          {preview.status === "idle" && (
            <p className="mt-2 text-xs text-slate-500">Saisissez le code puis cliquez sur « Vérifier le code ».</p>
          )}
        </div>

        {preview.isValid && <ClassPreviewCard preview={preview.preview} className="mt-3" />}

        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Vérification…
              </>
            ) : preview.isValid ? (
              <>
                Continuer <FontAwesomeIcon icon={faArrowRight} />
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faMagnifyingGlass} /> Vérifier le code
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinClassModal;
