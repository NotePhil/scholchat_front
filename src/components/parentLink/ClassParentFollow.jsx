import React, { useState } from "react";
import { Modal, Input, Alert } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faLinkSlash, faUserShield, faXmark } from "@fortawesome/free-solid-svg-icons";
import { approveFollowRequest, rejectFollowRequest, removeParentFollow } from "../../services/parentLinkService";

/**
 * Parental follow-up of a class's ADULT students, for class managers (professors) / admin.
 *  - ClassFollowRequests: pending « Demande de suivi parental — <Parent> souhaite suivre <Élève> » items of the
 *    class « Demandes » tab, with Approuver / Refuser (+ confirmation, optional refusal reason).
 *  - ClassParentFollows: parents who follow the class's adult students, with « Retirer le suivi » (+ confirmation).
 * Both are controlled: `items` come from the class view (GET /classes/{id}/demandes-suivi | suivis-parentaux);
 * onChanged() is called after an action (also after a 409 « déjà traitée » so the list is reloaded).
 */

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const ConfirmModal = ({ open, title, okText, danger, withReason, children, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ok = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } catch (e) {
      setError(e?.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="Annuler"
      okButtonProps={{ danger, loading: busy }}
      cancelButtonProps={{ disabled: busy }}
      onOk={ok}
      onCancel={() => {
        if (busy) return;
        setReason("");
        setError(null);
        onCancel();
      }}
      destroyOnClose
    >
      <div className="space-y-3">
        {children}
        {withReason && (
          <div>
            <label htmlFor="follow-refusal-reason" className="block text-sm font-medium text-slate-700 mb-1">
              Motif (facultatif, communiqué au parent)
            </label>
            <Input.TextArea
              id="follow-refusal-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. Lien de parenté non confirmé"
            />
          </div>
        )}
        {error && <Alert type="error" showIcon message={error} />}
      </div>
    </Modal>
  );
};

export const ClassFollowRequests = ({ items = [], onChanged, onNotify }) => {
  const [decision, setDecision] = useState(null); // { mode: "approve" | "reject", item }

  if (!items.length) return null;

  const confirm = async (reason) => {
    const { mode, item } = decision;
    try {
      if (mode === "approve") await approveFollowRequest(item.id);
      else await rejectFollowRequest(item.id, reason);
      setDecision(null);
      onNotify?.(
        "success",
        mode === "approve"
          ? `${item.parentNom} suit désormais ${item.eleveNom} dans cette classe.`
          : `La demande de suivi de ${item.parentNom} a été refusée.`,
      );
      onChanged?.();
    } catch (e) {
      if (e?.status === 409 || e?.status === 404) {
        setDecision(null);
        onNotify?.("info", e.message || "Cette demande a déjà été traitée.");
        onChanged?.();
        return;
      }
      throw e;
    }
  };

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faUserShield} className="text-violet-600" />
        Demandes de suivi parental ({items.length})
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Demande de suivi parental</p>
                <p className="text-sm font-semibold text-slate-900">
                  {item.parentNom} souhaite suivre {item.eleveNom}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {[item.parentEmail, item.eleveEmail && `élève : ${item.eleveEmail}`].filter(Boolean).join(" · ")}
                </p>
                {formatDate(item.dateDemande) && (
                  <p className="text-xs text-slate-400">Demande du {formatDate(item.dateDemande)}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Une fois approuvé, le parent suit l'élève en lecture seule (classes, progression, devoirs).
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDecision({ mode: "approve", item })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  <FontAwesomeIcon icon={faCheck} /> Approuver
                </button>
                <button
                  type="button"
                  onClick={() => setDecision({ mode: "reject", item })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold"
                >
                  <FontAwesomeIcon icon={faXmark} /> Refuser
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={!!decision}
        title={decision?.mode === "reject" ? "Refuser la demande de suivi" : "Approuver la demande de suivi"}
        okText={decision?.mode === "reject" ? "Refuser" : "Approuver"}
        danger={decision?.mode === "reject"}
        withReason={decision?.mode === "reject"}
        onConfirm={confirm}
        onCancel={() => setDecision(null)}
      >
        {decision && (
          <p className="text-sm text-slate-600">
            {decision.mode === "reject"
              ? `Refuser que ${decision.item.parentNom} suive la scolarité de ${decision.item.eleveNom} ? Le parent sera prévenu.`
              : `Autoriser ${decision.item.parentNom} à suivre ${decision.item.eleveNom} dans ${decision.item.classeNom ? `la classe « ${decision.item.classeNom} »` : "cette classe"} (lecture seule) ? L'élève et le parent seront prévenus.`}
          </p>
        )}
      </ConfirmModal>
    </div>
  );
};

export const ClassParentFollows = ({ items = [], onChanged, onNotify }) => {
  const [removing, setRemoving] = useState(null);

  if (!items.length) return null;

  const confirm = async () => {
    try {
      await removeParentFollow(removing.id);
      onNotify?.("success", `${removing.parentNom} ne suit plus ${removing.eleveNom} dans cette classe.`);
      setRemoving(null);
      onChanged?.();
    } catch (e) {
      if (e?.status === 404) {
        setRemoving(null);
        onChanged?.();
        return;
      }
      throw e;
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <FontAwesomeIcon icon={faEye} className="text-sky-600" />
        Suivi parental des élèves majeurs ({items.length})
      </h3>
      <p className="text-xs text-slate-500 mb-2">
        Ces parents suivent cette classe pour un élève majeur, en lecture seule. Seuls les professeurs de la classe et
        l'administration peuvent retirer ce suivi (il ne concerne que cette classe).
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id || `${item.parentId}-${item.eleveId}`}
            className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {item.parentNom} <span className="font-normal text-slate-500">suit</span> {item.eleveNom}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {item.parentEmail}
                {formatDate(item.depuis) ? ` · depuis le ${formatDate(item.depuis)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRemoving(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold"
            >
              <FontAwesomeIcon icon={faLinkSlash} /> Retirer le suivi
            </button>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={!!removing}
        title="Retirer le suivi parental"
        okText="Retirer le suivi"
        danger
        onConfirm={confirm}
        onCancel={() => setRemoving(null)}
      >
        {removing && (
          <p className="text-sm text-slate-600">
            {removing.parentNom} ne suivra plus {removing.eleveNom} dans
            {removing.classeNom ? ` la classe « ${removing.classeNom} »` : " cette classe"} (les autres classes suivies ne
            changent pas). Le parent et l'élève seront prévenus.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
};
