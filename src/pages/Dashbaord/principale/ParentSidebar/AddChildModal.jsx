import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSchool, faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Alert, Button } from "../../../../components/frontoffice/ui";
import ChildCodeCard from "../../../../components/frontoffice/ChildCodeCard";
import {
  cleanClassCodes,
  isValidEmail,
  registerAdultChild,
  registerChild,
  requestClassForChild,
} from "../../../../services/parentChildrenService";

const EMPTY = { type: "MINEUR", email: "", prenom: "", nom: "", codeClasse: "", codesClasse: [""] };

const CODE_ERRORS = ["CODE_CLASSE_INVALIDE", "CLASSE_NON_ACTIVE", "CODE_CLASSE_REQUIS", "CLASSE_RESERVEE_MINEURS"];
// Adult child: errors about one of the class codes (shown under the codes).
const ADULT_CODE_ERRORS = [...CODE_ERRORS, "ELEVE_PAS_DANS_CLASSE", "LIEN_PARENT_DEJA_DEMANDE"];

/**
 * Parent: « Ajouter un enfant » (prénom, nom, class code verified → POST /parents/{id}/enfants/inscription)
 * — or an adult child with the e-mail of his existing student account (« Majeur » → POST /parents/{id}/enfants/majeur:
 * one follow request per class code, validated by that class's professor; 404 ELEVE_INTROUVABLE when he has no
 * student account, 400 ELEVE_PAS_DANS_CLASSE when he is not in a class) —
 * or, with an adult `child`, « Suivre une autre classe » (only the class code(s); his e-mail is known) —
 * or, with `child`, « Rejoindre une autre classe » for that existing child (class code verified →
 * POST /acceder/demandes with estParent=true + eleveAssocieId). The request then waits for the teacher.
 * onChildAdded(entry) is called after a success (the "childrenUpdated" window event is also emitted).
 */
const AddChildModal = ({ isOpen, onClose, onChildAdded, child = null }) => {
  // Adult child already known: « Suivre une autre classe » (codes only). Minor child: « Rejoindre une autre classe ».
  const followMode = !!child && !!child.majeur;
  const joinMode = !!child && !followMode;
  const [value, setValue] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setValue(followMode ? { ...EMPTY, type: "MAJEUR", email: child.email || "" } : EMPTY);
    setPreview(null);
    setErrors({});
    setError("");
    setSuccess("");
    setLoading(false);
  }, [isOpen, child]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const adult = followMode || (!joinMode && value.type === "MAJEUR");

  const change = (field, v) => {
    if (field === "type") {
      // The class is checked again (an adult's code must accept adults).
      setValue((prev) => ({ ...prev, type: v }));
      setPreview(null);
      setResetKey((k) => k + 1);
      setErrors({});
      setError("");
      return;
    }
    setValue((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined, suggestAdult: undefined }));
    setError("");
  };

  const childName = child ? `${child.prenom || ""} ${child.nom || ""}`.trim() : "";

  const submit = async (e) => {
    e.preventDefault();
    if (loading || success) return;
    const errs = {};
    if (adult) {
      if (!value.email.trim()) errs.email = "L'e-mail de votre enfant est requis";
      else if (!isValidEmail(value.email)) errs.email = "Adresse e-mail invalide";
      if (cleanClassCodes(value.codesClasse).length === 0) errs.codesClasse = "Indiquez le code d'au moins une classe";
    } else if (!joinMode) {
      if (!value.prenom.trim()) errs.prenom = "Le prénom est requis";
      if (!value.nom.trim()) errs.nom = "Le nom est requis";
    }
    if (!adult && !preview) errs.codeClasse = value.codeClasse.trim() ? "Cliquez sur « Vérifier le code »" : "Le code de la classe est requis";
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
      if (adult) {
        entry = await registerAdultChild({ email: value.email, codesClasse: value.codesClasse });
        const name = `${entry?.prenom || ""} ${entry?.nom || ""}`.trim() || childName || value.email.trim();
        const noms = (entry?.classes || []).map((k) => k.classeNom).filter(Boolean);
        setSuccess(
          `Votre demande de suivi de ${name}${noms.length ? ` (${noms.map((n) => `« ${n} »`).join(", ")})` : ""} a été envoyée. Le professeur de chaque classe doit la valider ; vous suivrez ensuite ces classes en lecture seule dans « Mes enfants ».`,
        );
      } else if (joinMode) {
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
      if (!adult && CODE_ERRORS.includes(code)) {
        setPreview(null);
        setResetKey((k) => k + 1);
        setErrors({ codeClasse: msg });
      } else if (adult && (ADULT_CODE_ERRORS.includes(code) || (code === "ENFANT_INVALIDE" && /code|classe/i.test(msg)))) {
        setErrors({ codesClasse: msg });
      } else if (adult && ["COMPTE_NON_ELEVE", "ELEVE_INTROUVABLE", "ENFANT_EN_DOUBLE", "ENFANT_INVALIDE"].includes(code)) {
        setErrors({ email: msg });
      } else if (code === "ENFANT_INVALIDE" || code === "ENFANT_EN_DOUBLE" || code === "ELEVE_EXISTE_AVEC_COMPTE") {
        setErrors({ general: msg, suggestAdult: code === "ELEVE_EXISTE_AVEC_COMPTE" });
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
              <FontAwesomeIcon icon={joinMode || followMode ? faSchool : faUserPlus} />
            </div>
            <div className="min-w-0">
              <h2 id="child-class-modal-title" className="text-lg font-bold text-slate-900">
                {joinMode ? "Rejoindre une autre classe" : followMode ? "Suivre une autre classe" : "Ajouter un enfant"}
              </h2>
              {(joinMode || followMode) && childName && <p className="text-sm text-slate-500 truncate">Pour {childName}</p>}
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
                {followMode
                  ? "Indiquez le code de chaque classe de votre enfant que vous souhaitez suivre. Le professeur de chaque classe validera votre demande."
                  : joinMode
                  ? "Saisissez le code de la nouvelle classe et vérifiez-le. La demande sera envoyée au professeur."
                  : adult
                    ? "Votre enfant majeur a son propre compte élève : indiquez son adresse e-mail et le code de chaque classe à suivre. Le professeur de chaque classe validera votre demande, puis vous suivrez ces classes en lecture seule."
                    : "Renseignez le prénom, le nom et le code de la classe de votre enfant, puis vérifiez le code. La demande sera envoyée au professeur de la classe."}
              </p>
              <ChildCodeCard
                idPrefix={joinMode ? "join-class" : "add-child"}
                value={value}
                errors={errors}
                resetKey={resetKey}
                verifiedPreview={preview}
                showNames={!joinMode && !followMode}
                allowAdult={!joinMode && !followMode}
                adultEmailLocked={followMode}
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
                disabled={
                  adult
                    ? !value.email.trim()
                    : !preview || (!joinMode && (!value.prenom.trim() || !value.nom.trim()))
                }
                icon={joinMode || followMode ? faPaperPlane : faUserPlus}
              >
                {joinMode || followMode ? "Envoyer la demande" : "Ajouter l'enfant"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
