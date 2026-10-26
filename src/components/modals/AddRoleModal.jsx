import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCamera,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faIdCard,
  faKey,
  faMagnifyingGlass,
  faPaperPlane,
  faSpinner,
  faUserGear,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ROLE_CONFIG } from "./RoleSelectorModal";
import {
  STUDENT_SWITCH_HINT,
  getAddableRoles,
  getStoredHeldRoles,
  isStudentSession,
  isStudentSwitchForbidden,
  normalizeRoleName,
} from "../../utils/roleRules";
import {
  PROFESSOR_DOCS as DOCS,
  authHeaders,
  patchProfessorDocuments,
  uploadProfessorDocument,
} from "../../utils/professorDocuments";
import { useClassPreview } from "../../hooks/useClassPreview";
import { ClassPreviewCard } from "../common/ClassPreviewCard";

const API = process.env.REACT_APP_API_BASE_URL;

// Profiles that can be added from a parent / professor session (see utils/roleRules).
const OPTIONS = {
  PARENT: { type: "parent", hint: "Disponible immédiatement" },
  PROFESSOR: { type: "professeur", hint: "Pièces d'identité + validation par l'administration" },
  STUDENT: { type: "eleve", hint: "Code de la classe + approbation du professeur" },
};
const TYPE_TO_ROLE = { parent: "PARENT", professeur: "PROFESSOR", eleve: "STUDENT" };
const DOC_ICONS = { selfieUrl: faCamera };

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const readError = async (resp, fallback) => {
  const data = await resp.json().catch(() => ({}));
  return new ApiError(data.message || fallback, data.code, resp.status);
};

/**
 * "Ajouter un profil" for the logged-in user (parent / professor session). POST /utilisateurs with
 * the account's own e-mail adds the role to the SAME account — personal details are reused:
 *  - parent: usable at once;
 *  - professeur: only the identity documents are asked (CNI recto / verso + selfie, authenticated
 *    upload) → PATCH; the profile becomes usable after admin validation (notification
 *    PROFESSOR_ROLE_VALIDATED); status visible in "Mes profils";
 *  - élève: class code (live preview) → pending request; active after the teacher's approval.
 * The session is then refreshed (POST /auth/switch-role with the current token) so the profiles
 * list is up to date. `docsOnly` re-sends the professor documents (missing / refused).
 * A student session can't add anything (403 CHANGEMENT_PROFIL_INTERDIT_ELEVE).
 */
const AddRoleModal = ({ isOpen, onClose, onRolesUpdated, onOpenProfile, initialType = null, docsOnly = false }) => {
  const [type, setType] = useState(initialType);
  const [files, setFiles] = useState({});
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { title, text, pending }
  const classPreview = useClassPreview(code, "eleve", { enabled: isOpen && type === "eleve" });

  useEffect(() => {
    if (!isOpen) {
      setType(initialType);
      setFiles({});
      setCode("");
      setError("");
      setDone(null);
      setLoading(false);
    } else {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  const previews = useMemo(() => {
    const out = {};
    Object.entries(files).forEach(([k, f]) => {
      if (f) out[k] = URL.createObjectURL(f);
    });
    return out;
  }, [files]);
  useEffect(() => () => Object.values(previews).forEach((u) => URL.revokeObjectURL(u)), [previews]);

  if (!isOpen) return null;

  let authResponse = {};
  try {
    authResponse = JSON.parse(localStorage.getItem("authResponse") || "{}") || {};
  } catch {
    authResponse = {};
  }
  const studentSession = isStudentSession();
  const held = getStoredHeldRoles();
  const addable = getAddableRoles(held);
  const options = addable.filter((r) => OPTIONS[r]);
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");
  const currentRole = normalizeRoleName(authResponse.selectedRole || localStorage.getItem("userRole"));
  const pendingCount = (authResponse.pendingRoles || []).length;

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
    localStorage.setItem("availableRoles", JSON.stringify(data.availableRoles || []));
    if (data.children) localStorage.setItem("children", JSON.stringify(data.children));
    if (onRolesUpdated) onRolesUpdated(data);
  };

  const loadProfile = async () => {
    const resp = await fetch(`${API}/utilisateurs/${userId}`, { headers: authHeaders() });
    if (!resp.ok) throw await readError(resp, "Impossible de charger votre profil.");
    return resp.json();
  };

  const createRole = async (roleType, extra = {}) => {
    const profile = await loadProfile();
    const resp = await fetch(`${API}/utilisateurs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      // Personal details reused from the account; telephone/adresse are not re-sent (the backend keeps
      // the stored ones — a phone saved in an older format made the call fail).
      body: JSON.stringify({ type: roleType, nom: profile.nom, prenom: profile.prenom, email, etat: "INACTIVE", ...extra }),
    });
    if (!resp.ok) throw await readError(resp, "L'ajout du profil a échoué.");
    return resp.json().catch(() => ({}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !userId || !email || loading) return;
    setError("");
    if (type === "professeur" && DOCS.some((d) => !files[d.field])) {
      setError("Ajoutez la CNI (recto et verso) et une photo de vous (selfie) pour envoyer la demande.");
      return;
    }
    let preview = null;
    if (type === "eleve") {
      // Single button: "Vérifier le code" first (class card or error under the field), then "Envoyer la demande".
      if (!classPreview.isValid) {
        await classPreview.verify();
        return;
      }
      preview = classPreview.preview;
    }
    setLoading(true);
    try {
      if (type === "parent") {
        await createRole("parent");
        await refreshSession().catch(() => {});
        setDone({
          title: "Profil Parent ajouté",
          text: "Vous pouvez dès maintenant basculer vers ce profil depuis le sélecteur de profil.",
          pending: false,
        });
      } else if (type === "professeur") {
        if (!docsOnly) await createRole("professeur");
        const update = { hasUploaded: true };
        for (const doc of DOCS) update[doc.field] = await uploadProfessorDocument(files[doc.field], userId, doc.docType);
        await patchProfessorDocuments(userId, update);
        await refreshSession().catch(() => {});
        setDone({
          title: "Demande envoyée",
          text: "Vous pouvez continuer à utiliser votre compte. L'administration va vérifier vos documents ; vous serez notifié dès la validation de votre profil professeur. Suivez l'état de la demande dans votre profil (« Mes profils »).",
          pending: true,
        });
      } else if (type === "eleve") {
        const created = await createRole("eleve", { codeClasse: preview.code });
        await refreshSession().catch(() => {});
        const statut = String(created?.statutInscription || created?.inscriptionStatut || "").toUpperCase();
        const immediate = statut === "ROLE_ADDED" && created?.demandeAccesCreee === false;
        setDone({
          title: immediate ? "Profil Élève ajouté" : "Demande envoyée",
          text: immediate
            ? "Le profil Élève est actif : basculez vers lui depuis le sélecteur de profil."
            : `Votre demande a été envoyée au professeur de la classe « ${created?.classeNom || preview.nom} ». Le profil Élève sera actif dès son approbation ; vous recevrez une notification. Suivez l'état dans votre profil (« Mes profils »).`,
          pending: !immediate,
        });
      }
    } catch (err) {
      setError(
        isStudentSwitchForbidden(err)
          ? `${err.message ? `${err.message} ` : ""}${err.message?.includes("déconnectez") ? "" : STUDENT_SWITCH_HINT}`.trim()
          : err.message || "L'ajout du profil a échoué.",
      );
    } finally {
      setLoading(false);
    }
  };

  const titleRole = type ? ROLE_CONFIG[TYPE_TO_ROLE[type]]?.label : null;
  const canSubmit =
    !!type &&
    !loading &&
    (type !== "professeur" || DOCS.every((d) => files[d.field])) &&
    (type !== "eleve" || (!!code.trim() && classPreview.status !== "loading"));
  const verifyingCode = type === "eleve" && !classPreview.isValid;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-role-title"
        className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {type && !initialType && !done ? (
              <button
                type="button"
                onClick={() => {
                  setType(null);
                  setError("");
                }}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                aria-label="Retour"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            ) : (
              <div className="w-10 h-10 shrink-0 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faUserPlus} className="text-indigo-600 dark:text-indigo-300" />
              </div>
            )}
            <h2 id="add-role-title" className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {docsOnly ? "Documents du profil professeur" : titleRole ? `Ajouter le profil ${titleRole}` : "Ajouter un profil"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500" aria-label="Fermer">
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <span
              className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                done.pending ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10" : "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10"
              }`}
            >
              <FontAwesomeIcon icon={done.pending ? faPaperPlane : faCircleCheck} />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{done.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{done.text}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <FontAwesomeIcon icon={faUserGear} /> Voir mes profils
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] shadow"
              >
                Continuer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300" role="alert">
                <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {studentSession ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 text-indigo-800 text-sm dark:bg-indigo-500/10 dark:text-indigo-200">
                <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
                <span>
                  Depuis le profil élève, il n'est pas possible d'ajouter ou de changer de profil. {STUDENT_SWITCH_HINT}
                </span>
              </div>
            ) : !type ? (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Un même compte ({email}) peut être parent, professeur et élève. Vos informations personnelles sont reprises :
                  choisissez simplement le profil à ajouter.
                </p>
                {options.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Vous avez déjà tous les profils disponibles{pendingCount > 0 ? " (certains sont en attente de validation)." : "."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {options.map((r) => {
                      const cfg = ROLE_CONFIG[r];
                      const Icon = cfg.icon;
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setType(OPTIONS[r].type)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${cfg.borderColor} ${cfg.lightBg} hover:border-indigo-500 transition-all`}
                        >
                          <div className={`w-10 h-10 ${cfg.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left flex-1">
                            <p className={`font-semibold ${cfg.textColor}`}>{cfg.label}</p>
                            <p className="text-xs text-gray-500">{OPTIONS[r].hint}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : null}

            {!studentSession && type === "parent" && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Le profil Parent est ajouté immédiatement à votre compte. Vous pourrez ensuite ajouter vos enfants et suivre leur
                scolarité.
              </p>
            )}

            {!studentSession && type === "professeur" && (
              <div className="space-y-3">
                <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-indigo-500" />
                  <span>
                    Vos informations personnelles sont reprises de votre compte. Ajoutez seulement vos pièces : elles seront
                    vérifiées par l'administration.
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DOCS.map((doc) => (
                    <label
                      key={doc.field}
                      className={`relative flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition ${
                        files[doc.field] ? "border-emerald-400" : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                      }`}
                    >
                      {previews[doc.field] ? (
                        <img src={previews[doc.field]} alt={doc.label} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={DOC_ICONS[doc.field] || faIdCard} className="text-xl text-slate-400 mb-1" />
                          <span className="text-[11px] text-center px-1 text-slate-500 dark:text-slate-400">{doc.label}</span>
                        </>
                      )}
                      {files[doc.field] && (
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center">
                          <FontAwesomeIcon icon={faCircleCheck} />
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f && !f.type.startsWith("image/")) {
                            setError("Choisissez une image (JPEG, PNG).");
                            return;
                          }
                          if (f) {
                            setError("");
                            setFiles((prev) => ({ ...prev, [doc.field]: f }));
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">CNI recto, CNI verso et une photo de vous (selfie) — obligatoires.</p>
              </div>
            )}

            {!studentSession && type === "eleve" && (
              <div className="space-y-2">
                <label htmlFor="add-role-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Code de la classe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <FontAwesomeIcon icon={faKey} />
                  </span>
                  <input
                    id="add-role-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    placeholder="Ex. 123456"
                    className={`w-full rounded-xl border-2 bg-white dark:bg-slate-900 dark:text-white py-2.5 pl-10 pr-3 font-semibold tracking-wider outline-none ${
                      classPreview.status === "error" ? "border-red-300" : classPreview.isValid ? "border-emerald-400" : "border-slate-200 dark:border-slate-600 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {classPreview.status === "error" && <p className="text-sm text-red-600">{classPreview.error}</p>}
                {classPreview.status === "idle" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Code fourni par le professeur de la classe.</p>
                )}
                {classPreview.isValid && <ClassPreviewCard preview={classPreview.preview} title="Vous rejoindrez" compact />}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Le profil Élève sera actif après l'approbation de votre demande par le professeur.
                </p>
              </div>
            )}

            {!studentSession && type && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-[#4F46E5] to-[#8C52FF] shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(loading || (verifyingCode && classPreview.status === "loading")) && (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                )}
                {verifyingCode && classPreview.status !== "loading" && <FontAwesomeIcon icon={faMagnifyingGlass} />}
                {verifyingCode
                  ? classPreview.status === "loading"
                    ? "Vérification…"
                    : "Vérifier le code"
                  : type === "parent"
                    ? "Ajouter ce profil"
                    : "Envoyer la demande"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AddRoleModal;
