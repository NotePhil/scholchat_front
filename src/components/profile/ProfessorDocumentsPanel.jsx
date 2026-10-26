import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faExpand,
  faFileArrowUp,
  faFileLines,
  faFilePdf,
  faHourglassHalf,
  faImage,
  faRotate,
  faSpinner,
  faTriangleExclamation,
  faUpload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { minioS3Service } from "../../services/minioS3";
import {
  PROFESSOR_DOCS,
  patchProfessorDocuments,
  uploadProfessorDocument,
} from "../../utils/professorDocuments";
import {
  notifyProfessorNotValidated,
  PROFESSOR_STATUS,
  storeProfessorStatus,
} from "../../utils/professorVerification";

const LABELS = {
  cniUrlRecto: "CNI Recto",
  cniUrlVerso: "CNI Verso",
  selfieUrl: "Photo",
};

const STATUS_META = {
  VALIDE: {
    label: "Validé",
    icon: faCircleCheck,
    light: "bg-green-50 border-green-200 text-green-700",
    dark: "bg-green-900/20 border-green-800 text-green-300",
  },
  EN_ATTENTE_VALIDATION: {
    label: "En attente de validation",
    icon: faHourglassHalf,
    light: "bg-amber-50 border-amber-200 text-amber-700",
    dark: "bg-amber-900/20 border-amber-800 text-amber-300",
  },
  DOCUMENTS_MANQUANTS: {
    label: "Documents manquants",
    icon: faFileArrowUp,
    light: "bg-blue-50 border-blue-200 text-blue-700",
    dark: "bg-blue-900/20 border-blue-800 text-blue-300",
  },
  REJETE: {
    label: "Refusé",
    icon: faCircleXmark,
    light: "bg-red-50 border-red-200 text-red-700",
    dark: "bg-red-900/20 border-red-800 text-red-300",
  },
};

export const getVerificationLabel = (status) => STATUS_META[status]?.label || null;

// Stored CNI/selfie values are often full storage URLs, while
// /media/download-by-path wants the relative key.
export const toRelativePath = (raw) => {
  if (!raw || !raw.startsWith("http")) return raw;
  try {
    const pathname = new URL(raw).pathname.replace(/^\//, "");
    const idx = pathname.indexOf("users/");
    if (idx >= 0) return pathname.slice(idx);
    const parts = pathname.split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : pathname;
  } catch {
    return raw;
  }
};

export const useResolvedMediaUrl = (path) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    setUrl(null);
    if (!path) return undefined;
    let cancelled = false;
    minioS3Service
      .getMediaUrlByPath(toRelativePath(path))
      .then((resolved) => {
        if (!cancelled && resolved) setUrl(resolved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
};

const isPdf = (path) => /\.pdf($|\?)/i.test(path || "");

const DocumentTile = ({ field, path, isDark, busy, disabled, onPreview, onReplace }) => {
  const url = useResolvedMediaUrl(path);
  const [failed, setFailed] = useState(false);
  const label = LABELS[field];
  useEffect(() => setFailed(false), [path]);

  return (
    <div className="flex flex-col min-w-0">
      {path ? (
        <button
          type="button"
          onClick={() => url && onPreview({ url, label, pdf: isPdf(path) })}
          disabled={!url}
          className={`group relative h-28 sm:h-32 rounded-xl overflow-hidden border ${isDark ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-100"} flex items-center justify-center hover:shadow-md transition-shadow`}
          title={`Afficher : ${label}`}
        >
          {isPdf(path) ? (
            <FontAwesomeIcon icon={faFilePdf} className="w-8 h-8 text-red-500" />
          ) : url && !failed ? (
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : url || failed ? (
            <FontAwesomeIcon icon={faFileLines} className="w-7 h-7 text-gray-400" />
          ) : (
            <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 text-gray-400 animate-spin" />
          )}
          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-900/60 text-white flex items-center justify-center opacity-80 group-hover:opacity-100">
            <FontAwesomeIcon icon={faExpand} className="w-3 h-3" />
          </span>
        </button>
      ) : (
        <div
          className={`h-28 sm:h-32 rounded-xl border-2 border-dashed ${isDark ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-400"} flex flex-col items-center justify-center gap-1`}
        >
          <FontAwesomeIcon icon={faImage} className="w-6 h-6" />
          <span className="text-xs">Non fourni</span>
        </div>
      )}
      <p className={`mt-2 text-xs sm:text-sm font-semibold text-center truncate ${isDark ? "text-gray-200" : "text-gray-700"}`}>
        {label}
      </p>
      <button
        type="button"
        onClick={onReplace}
        disabled={disabled}
        className={`mt-1.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${isDark ? "bg-blue-900/40 text-blue-300 hover:bg-blue-900/60" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
      >
        <FontAwesomeIcon
          icon={busy ? faSpinner : path ? faRotate : faUpload}
          className={`w-3 h-3 ${busy ? "animate-spin" : ""}`}
        />
        {busy ? "Envoi..." : path ? "Remplacer" : "Ajouter"}
      </button>
    </div>
  );
};

/**
 * Professor verification documents on the profile page (web counterpart of the mobile
 * ProfessorDocumentsSection): verification status, thumbnails (click → full-screen image /
 * PDF viewer) and "Remplacer". Before replacing, a confirmation explains that the profile
 * goes back to verification: the backend sets statutVerification to EN_ATTENTE_VALIDATION,
 * notifies the admins, and every professor action is refused until an administrator
 * validates — the dashboard then shows the verification status screen.
 */
const ProfessorDocumentsPanel = ({ profile, isDark, onUpdated }) => {
  const userId = profile?.id || localStorage.getItem("userId");
  const status = profile?.statutVerification || null;
  const meta = status ? STATUS_META[status] : null;
  const [preview, setPreview] = useState(null);
  const [confirmDoc, setConfirmDoc] = useState(null);
  const [busyField, setBusyField] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const fileInput = useRef(null);
  const pendingDoc = useRef(null);

  useEffect(() => {
    if (!preview && !confirmDoc) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPreview(null);
        setConfirmDoc(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, confirmDoc]);

  const proceed = () => {
    pendingDoc.current = confirmDoc;
    setConfirmDoc(null);
    if (fileInput.current) {
      fileInput.current.value = "";
      fileInput.current.click();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    const doc = pendingDoc.current;
    pendingDoc.current = null;
    if (!file || !doc || !userId) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Veuillez choisir une image (JPG, PNG…).", type: "error" });
      return;
    }
    setBusyField(doc.field);
    setMessage({ text: "", type: "" });
    try {
      const url = await uploadProfessorDocument(file, userId, doc.docType);
      const updated = await patchProfessorDocuments(userId, { [doc.field]: url });
      const next = updated?.statutVerification || null;
      if (onUpdated) await onUpdated(updated);
      if (next && next !== PROFESSOR_STATUS.VALIDE) {
        setMessage({
          text: "Document envoyé. Votre profil professeur est de nouveau en attente de validation par l'administrateur.",
          type: "success",
        });
        storeProfessorStatus(next, updated?.motifRejetVerification || null);
        // Leaves the professor dashboard for the verification status screen (Principal gate).
        setTimeout(() => notifyProfessorNotValidated(), 2500);
      } else {
        setMessage({ text: "Document mis à jour.", type: "success" });
      }
    } catch (err) {
      setMessage({ text: err.message || "L'envoi du document a échoué.", type: "error" });
    } finally {
      setBusyField(null);
    }
  };

  return (
    <div>
      {meta && (
        <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border mb-4 ${isDark ? meta.dark : meta.light}`}>
          <FontAwesomeIcon icon={meta.icon} className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs opacity-80">Statut de vérification</p>
            <p className="font-semibold">{meta.label}</p>
            {status === PROFESSOR_STATUS.REJETE && profile?.motifRejetVerification && (
              <p className="text-sm mt-1">Motif du refus : {profile.motifRejetVerification}</p>
            )}
          </div>
        </div>
      )}

      <p className={`text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        Cliquez sur une pièce pour l'afficher en plein écran.
      </p>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {PROFESSOR_DOCS.map((doc) => (
          <DocumentTile
            key={doc.field}
            field={doc.field}
            path={profile?.[doc.field] || ""}
            isDark={isDark}
            busy={busyField === doc.field}
            disabled={!!busyField}
            onPreview={setPreview}
            onReplace={() => setConfirmDoc(doc)}
          />
        ))}
      </div>

      {message.text && (
        <div
          className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <FontAwesomeIcon
            icon={message.type === "success" ? faCircleCheck : faCircleExclamation}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Confirmation before replacing */}
      {confirmDoc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDoc(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold">Modifier ce document ?</h3>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              En modifiant ce document ({LABELS[confirmDoc.field]}), votre profil professeur
              repassera en vérification. Certaines fonctionnalités seront limitées jusqu'à la
              validation par l'administrateur.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDoc(null)}
                className={`px-5 py-2.5 rounded-xl font-semibold border ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={proceed}
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow hover:shadow-lg"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen viewer */}
      {preview && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
          <div className="w-full h-full max-w-5xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {preview.pdf ? (
              <iframe title={preview.label} src={preview.url} className="w-full h-[85vh] rounded-lg bg-white" />
            ) : (
              <img src={preview.url} alt={preview.label} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            )}
          </div>
          <p className="mt-3 text-white font-medium">{preview.label}</p>
        </div>
      )}
    </div>
  );
};

export default ProfessorDocumentsPanel;
