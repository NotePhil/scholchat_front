import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faIdCard,
  faSpinner,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ROLE_CONFIG } from "./RoleSelectorModal";
import { getAddableRoles, getStoredHeldRoles } from "../../utils/roleRules";

import {
  PROFESSOR_DOCS as DOCS,
  authHeaders,
  patchProfessorDocuments,
  uploadProfessorDocument as uploadDocument,
} from "../../utils/professorDocuments";

const API = process.env.REACT_APP_API_BASE_URL;

// Roles a user can add to their own account. The student profile is exclusive: it is never
// added, and a student account adds nothing (see utils/roleRules + backend ROLE_INCOMPATIBLE).
const ADDABLE = [
  { type: "parent", role: "PARENT" },
  { type: "professeur", role: "PROFESSOR" },
];

const normalizeRole = (r) =>
  String(r || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");

const readError = async (resp, fallback) => {
  const data = await resp.json().catch(() => ({}));
  return new Error(data.message || fallback);
};

/**
 * "Ajouter un profil" for the logged-in user — the in-app version of SignUp.jsx's
 * existing-email path: POST /utilisateurs with the account's own email adds the role
 * to the SAME account (parent: usable at once; professeur: documents + admin
 * validation). The session is then refreshed (POST /auth/switch-role with the current
 * token, no password) so the new profile shows up in the profile switcher.
 * Same flow as the mobile AddRoleSheet.
 */
const AddRoleModal = ({ isOpen, onClose, onRolesUpdated }) => {
  const [type, setType] = useState(null);
  const [matricule, setMatricule] = useState("");
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setType(null);
      setMatricule("");
      setFiles({});
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let authResponse = {};
  try {
    authResponse = JSON.parse(localStorage.getItem("authResponse") || "{}");
  } catch {
    authResponse = {};
  }
  const pending = authResponse.pendingRoles || [];
  const held = getStoredHeldRoles();
  const isStudent = held.map(normalizeRole).includes("STUDENT");
  const addable = getAddableRoles(held);
  const options = ADDABLE.filter((o) => addable.includes(o.role));
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");
  const currentRole = normalizeRole(
    authResponse.selectedRole || localStorage.getItem("userRole"),
  );

  const refreshSession = async () => {
    const resp = await fetch(`${API}/auth/switch-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ selectedRole: currentRole }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("authToken", data.accessToken);
    localStorage.setItem("authResponse", JSON.stringify(data));
    localStorage.setItem(
      "availableRoles",
      JSON.stringify(data.availableRoles || []),
    );
    if (data.children)
      localStorage.setItem("children", JSON.stringify(data.children));
    if (onRolesUpdated) onRolesUpdated(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !userId || !email) return;
    if (type === "professeur" && DOCS.some((d) => !files[d.field])) {
      setError(
        "La CNI (recto et verso) et une photo de profil sont requises pour le profil professeur.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profileResp = await fetch(`${API}/utilisateurs/${userId}`, {
        headers: authHeaders(),
      });
      if (!profileResp.ok)
        throw await readError(profileResp, "Impossible de charger votre profil.");
      const profile = await profileResp.json();

      const payload = {
        type,
        nom: profile.nom,
        prenom: profile.prenom,
        email,
        // telephone/adresse are not re-sent: the backend keeps the account's stored details, and a
        // phone saved in an older format made the call fail ("Invalid phone number format").
        etat: "INACTIVE",
      };
      const createResp = await fetch(`${API}/utilisateurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!createResp.ok)
        throw await readError(createResp, "L'ajout du profil a échoué.");
      const created = await createResp.json();

      if (type === "professeur") {
        const update = {};
        for (const doc of DOCS) {
          update[doc.field] = await uploadDocument(
            files[doc.field],
            userId,
            doc.docType,
          );
        }
        if (matricule.trim()) update.matriculeProfesseur = matricule.trim();
        await patchProfessorDocuments(userId, update);
      }

      await refreshSession().catch(() => {});
      setSuccess(
        created.inscriptionStatut === "ROLE_PENDING_VALIDATION" ||
          type === "professeur"
          ? "Demande de profil professeur reçue. Elle sera active après validation par l'administration."
          : "Rôle ajouté avec succès! Vous pouvez y basculer depuis le sélecteur de profil.",
      );
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      setError(err.message || "L'ajout du profil a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon
                icon={faUserPlus}
                className="w-5 h-5 text-indigo-600"
              />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Ajouter un profil
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Un même compte ({email}) peut être à la fois parent et professeur.
            Choisissez le profil à ajouter.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
              {success}
            </div>
          )}

          {options.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {isStudent
                ? "Un compte élève ne peut pas avoir d'autre profil. Utilisez une autre adresse e-mail pour créer un compte parent ou professeur."
                : `Vous avez déjà tous les profils disponibles${
                    pending.length > 0
                      ? " (certains sont en attente de validation)."
                      : "."
                  }`}
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((o) => {
                const cfg = ROLE_CONFIG[o.role];
                const Icon = cfg.icon;
                const selected = type === o.type;
                return (
                  <button
                    type="button"
                    key={o.type}
                    onClick={() => setType(o.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${selected ? "border-indigo-500" : cfg.borderColor} ${cfg.lightBg} transition-all`}
                  >
                    <div
                      className={`w-10 h-10 ${cfg.color} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`font-semibold ${cfg.textColor}`}>
                        {cfg.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {o.type === "professeur"
                          ? "Pièces d'identité + validation par l'administration"
                          : "Disponible immédiatement"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {type === "professeur" && (
            <div className="space-y-3">
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Matricule enseignant (optionnel)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
              />
              {DOCS.map((doc) => (
                <label
                  key={doc.field}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${files[doc.field] ? "border-green-400 bg-green-50" : "border-gray-300"}`}
                >
                  <FontAwesomeIcon
                    icon={files[doc.field] ? faCircleCheck : faIdCard}
                    className={
                      files[doc.field] ? "text-green-600" : "text-indigo-600"
                    }
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{doc.label} *</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {files[doc.field]
                        ? files[doc.field].name
                        : "Choisir une image"}
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) setFiles((prev) => ({ ...prev, [doc.field]: f }));
                    }}
                  />
                </label>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!type || loading || !!success}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
            )}
            {type === "professeur" ? "Envoyer la demande" : "Ajouter ce profil"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal;
