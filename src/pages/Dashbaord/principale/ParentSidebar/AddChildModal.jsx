import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSchool, faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Alert, Button } from "../../../../components/frontoffice/ui";
import ChildCodeCard from "../../../../components/frontoffice/ChildCodeCard";
import { registerChild, requestClassForChild } from "../../../../services/parentChildrenService";

const EMPTY = { prenom: "", nom: "", codeClasse: "" };
const CODE_ERRORS = ["CODE_CLASSE_INVALIDE", "CLASSE_NON_ACTIVE", "CODE_CLASSE_REQUIS", "CLASSE_RESERVEE_MINEURS"];

/**
 * Parent: « Ajouter un enfant » (prénom, nom, class code verified → POST /parents/{id}/enfants/inscription)
 * or, with `child`, « Rejoindre une autre classe » for that existing child (class code verified →
 * POST /acceder/demandes with estParent=true + eleveAssocieId). The request then waits for the teacher.
 * onChildAdded(entry) is called after a success (the "childrenUpdated" window event is also emitted).
 */
const AddChildModal = ({ isOpen, onClose, onChildAdded, child = null }) => {
  const joinMode = !!child;
  const [value, setValue] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setValue(EMPTY);
    setPreview(null);
    setErrors({});
    setError("");
    setSuccess("");
    setLoading(false);
  }, [isOpen, child]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const change = (field, v) => {
    setValue((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    setError("");
  };

  const childName = child ? `${child.prenom || ""} ${child.nom || ""}`.trim() : "";

  const submit = async (e) => {
    e.preventDefault();
    if (loading || success) return;
    const errs = {};
    if (!joinMode) {
      if (!value.prenom.trim()) errs.prenom = "Le prénom est requis";
      if (!value.nom.trim()) errs.nom = "Le nom est requis";
    }
    if (!preview) errs.codeClasse = value.codeClasse.trim() ? "Cliquez sur « Vérifier le code »" : "Le code de la classe est requis";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (joinMode && (child.classes || []).some((c) => String(c.classeId) === String(preview.id) && c.statut !== "REJETEE")) {
      setError(`${childName || "Cet enfant"} est déjà inscrit ou a déjà une demande en cours pour cette classe.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let entry;
      if (joinMode) {
        await requestClassForChild(child.id, preview);
        entry = child;
        setSuccess(`Demande envoyée pour ${childName || "votre enfant"} dans la classe « ${preview.nom} ». Elle attend la validation du professeur.`);
      } else {
        entry = await registerChild(value);
        setSuccess(
          `${value.prenom.trim()} ${value.nom.trim()} a été ajouté(e). La demande d'inscription dans la classe « ${preview.nom} » attend la validation du professeur.`,
        );
      }
      window.dispatchEvent(new CustomEvent("childrenUpdated", { detail: entry }));
      onChildAdded?.(entry);
      setTimeout(() => onClose?.(), 2200);
    } catch (err) {
      const code = String(err?.code || "").toUpperCase();
      const msg = err?.message || "Une erreur est survenue.";
      if (CODE_ERRORS.includes(code)) {
        setPreview(null);
        setResetKey((k) => k + 1);
        setErrors({ codeClasse: msg });
      } else if (code === "ENFANT_INVALIDE") {
        setErrors({ general: msg });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="child-class-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#10B981] shrink-0">
              <FontAwesomeIcon icon={joinMode ? faSchool : faUserPlus} />
            </div>
            <div className="min-w-0">
              <h2 id="child-class-modal-title" className="text-lg font-bold text-slate-900">
                {joinMode ? "Rejoindre une autre classe" : "Ajouter un enfant"}
              </h2>
              {joinMode && childName && <p className="text-sm text-slate-500 truncate">Pour {childName}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          {success ? (
            <Alert type="success">{success}</Alert>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                {joinMode
                  ? "Saisissez le code de la nouvelle classe et vérifiez-le. La demande sera envoyée au professeur."
                  : "Renseignez le prénom, le nom et le code de la classe de votre enfant, puis vérifiez le code. La demande sera envoyée au professeur de la classe."}
              </p>
              <ChildCodeCard
                idPrefix={joinMode ? "join-class" : "add-child"}
                value={value}
                errors={errors}
                resetKey={resetKey}
                verifiedPreview={preview}
                showNames={!joinMode}
                onChange={change}
                onPreviewChange={setPreview}
                disabled={loading}
              />
            </>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="subtle" className="sm:flex-1" onClick={onClose} disabled={loading}>
              {success ? "Fermer" : "Annuler"}
            </Button>
            {!success && (
              <Button
                type="submit"
                className="sm:flex-1"
                loading={loading}
                loadingLabel="Envoi…"
                disabled={!preview || (!joinMode && (!value.prenom.trim() || !value.nom.trim()))}
                icon={joinMode ? faPaperPlane : faUserPlus}
              >
                {joinMode ? "Envoyer la demande" : "Ajouter l'enfant"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
