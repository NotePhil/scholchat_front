import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faCamera,
  faCheck,
  faSpinner,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import { scholchatService } from "../../../../services/ScholchatService";
import { minioS3Service } from "../../../../services/minioS3";

// Shown after login when a validated professor's account is missing one or
// more of the identity documents normally collected at signup (e.g. an
// upload failed partway through registration). Admin validation no longer
// blocks on document completeness — see UtilisateursBusiness.validerProfesseur
// — so this prompt is the recovery path instead.
const CompleteProfileModal = ({ isOpen, userId, missingDocs, onClose, onCompleted }) => {
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
  };

  const uploadDocument = async (file, docType) => {
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const uniqueFileName = `${userId}_${docType}_${timestamp}.${fileExtension}`;
    const renamedFile = new File([file], uniqueFileName, { type: file.type });
    const result = await minioS3Service.uploadFile(
      renamedFile,
      "IMAGE",
      docType,
      null,
      userId,
    );
    return result.fileName;
  };

  const handleSave = async () => {
    const selectedFields = missingDocs.filter((doc) => files[doc.field]);
    if (selectedFields.length === 0) {
      setError("Veuillez sélectionner au moins un document.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {};
      for (const doc of selectedFields) {
        payload[doc.field] = await uploadDocument(files[doc.field], doc.docType);
      }
      const updatedUser = await scholchatService.updateUser(userId, payload);
      onCompleted(updatedUser);
    } catch (err) {
      console.error("Error completing profile:", err);
      setError(
        err.message || "Erreur lors de l'envoi des documents. Veuillez réessayer.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Complétez votre profil
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Il manque {missingDocs.length === 1 ? "un document" : `${missingDocs.length} documents`} à votre dossier.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {missingDocs.map((doc) => (
            <div key={doc.field} className="bg-slate-50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <FontAwesomeIcon icon={faIdCard} className="mr-2 text-indigo-600" />
                {doc.label}
              </label>

              <label className="flex items-center px-4 py-3 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 shadow-sm">
                <FontAwesomeIcon icon={faCamera} className="mr-2 text-indigo-600" style={{ fontSize: 16 }} />
                <span className="text-sm font-medium text-slate-700">
                  {files[doc.field] ? "Changer le fichier" : "Choisir un fichier"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(doc.field, e)}
                  className="hidden"
                />
              </label>

              {previews[doc.field] && (
                <div className="mt-3">
                  <p className="text-xs text-green-600 mb-2 font-medium flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="mr-1" style={{ fontSize: 12 }} />
                    Prêt à envoyer
                  </p>
                  <img
                    src={previews[doc.field]}
                    alt={doc.label}
                    className="h-24 w-36 object-cover rounded-lg border-2 border-green-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faCheck} />
            )}
            {saving ? "Envoi en cours..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
