import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faCamera,
  faCheck,
  faCircleCheck,
  faCircleXmark,
  faHourglassHalf,
  faIdCard,
  faRightFromBracket,
  faShuffle,
  faSpinner,
  faTriangleExclamation,
  faUser,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import NotificationIcon from "./modals/NotificationIcon";
import { scholchatService } from "../../../services/ScholchatService";
import { dashboardNameForRole, switchRoleWithToken } from "../../../utils/authSession";
import {
  PROFESSOR_DOCUMENTS,
  submitProfessorDocuments,
} from "../../../utils/professorDocuments";
import {
  PROFESSOR_STATUS,
  PROFESSOR_STATUS_NOTIFICATION_TYPES,
  getProfessorStatusDisplay,
  storeProfessorStatus,
} from "../../../utils/professorVerification";

const REFRESH_INTERVAL_MS = 60 * 1000;

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  PARENT: "Parent",
  STUDENT: "Élève",
  TUTOR: "Répétiteur",
  GESTIONNAIRE: "Gestionnaire",
};

const STATUS_CONTENT = {
  [PROFESSOR_STATUS.EN_ATTENTE_VALIDATION]: {
    title: "Profil en attente de validation",
    text: "Nous avons bien reçu vos pièces justificatives. Un administrateur est en train de les examiner. Vous pourrez utiliser les fonctionnalités professeur dès leur validation ; vous recevrez une notification.",
    icon: faHourglassHalf,
    iconClass: "bg-amber-100 text-amber-600",
  },
  [PROFESSOR_STATUS.DOCUMENTS_MANQUANTS]: {
    title: "Complétez votre profil",
    text: "Pour activer vos fonctionnalités professeur, déposez votre CNI (recto et verso) ainsi qu'un selfie. Un administrateur les validera ensuite.",
    icon: faTriangleExclamation,
    iconClass: "bg-indigo-100 text-indigo-600",
  },
  [PROFESSOR_STATUS.REJETE]: {
    title: "Profil refusé",
    text: "Vos pièces justificatives ont été refusées par l'administrateur. Déposez de nouvelles pièces : elles seront à nouveau examinées.",
    icon: faCircleXmark,
    iconClass: "bg-red-100 text-red-600",
  },
};

// Formulaire de dépôt des pièces (même logique que CompleteProfileModal).
const DocumentsForm = ({ userId, profile, rejected, onSubmitted }) => {
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [matricule, setMatricule] = useState(profile?.matriculeProfesseur || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.matriculeProfesseur) setMatricule((m) => m || profile.matriculeProfesseur);
  }, [profile?.matriculeProfesseur]);

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      return { ...prev, [field]: URL.createObjectURL(file) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selected = PROFESSOR_DOCUMENTS.filter((doc) => files[doc.field]);
    if (selected.length === 0) {
      setError("Veuillez sélectionner au moins un document.");
      return;
    }
    // Les pièces absentes du serveur sont obligatoires (les 3 doivent être présentes)
    const missing = PROFESSOR_DOCUMENTS.filter(
      (doc) => !files[doc.field] && !(profile && profile[doc.field]),
    );
    if (missing.length > 0) {
      setError(
        `Document(s) manquant(s) : ${missing.map((d) => d.label).join(", ")}.`,
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await submitProfessorDocuments(userId, files, {
        matriculeProfesseur: matricule,
      });
      setFiles({});
      setPreviews({});
      await onSubmitted();
    } catch (err) {
      setError(
        err?.message || "Erreur lors de l'envoi des documents. Veuillez réessayer.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PROFESSOR_DOCUMENTS.map((doc) => {
          const onServer = !!(profile && profile[doc.field]);
          return (
            <div key={doc.field} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                <FontAwesomeIcon icon={faIdCard} className="mr-2 text-indigo-600" />
                {doc.label}
              </p>
              {onServer && !files[doc.field] && (
                <p className="text-xs text-slate-500 mb-2">
                  {rejected ? "Déjà déposé (vous pouvez le remplacer)" : "Déjà reçu"}
                </p>
              )}
              <label className="flex items-center justify-center px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                <FontAwesomeIcon icon={faCamera} className="mr-2 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  {files[doc.field]
                    ? "Changer le fichier"
                    : onServer
                      ? "Remplacer"
                      : "Choisir un fichier"}
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
                  <p className="text-xs text-green-600 mb-1 font-medium flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    Prêt à envoyer
                  </p>
                  <img
                    src={previews[doc.field]}
                    alt={doc.label}
                    className="h-24 w-full object-cover rounded-lg border-2 border-green-200"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="matricule-professeur">
          Matricule professeur (facultatif)
        </label>
        <input
          id="matricule-professeur"
          type="text"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={saving ? faSpinner : faCheck} className={saving ? "animate-spin" : ""} />
          {saving ? "Envoi en cours..." : "Envoyer mes pièces"}
        </button>
      </div>
    </form>
  );
};

/**
 * Écran plein page affiché à la place du tableau de bord professeur tant que
 * le profil n'est pas validé par l'administrateur (statutVerification != VALIDE).
 */
const ProfessorVerificationStatus = ({
  status,
  motif,
  userName,
  userEmail,
  isDark,
  otherRoles = [],
  onStatusChange,
  onValidated,
  onLogout,
  renderSettings,
}) => {
  const userId = localStorage.getItem("userId");
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);
  const inFlight = useRef(false);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId || inFlight.current) return;
      inFlight.current = true;
      if (!silent) {
        setRefreshing(true);
        setError("");
        setInfo("");
      }
      try {
        const user = await scholchatService.getUserById(userId);
        setProfile(user || null);
        setLastChecked(new Date());
        // Champ absent (ancien serveur) : on ne bloque pas l'utilisateur
        const newStatus = user?.statutVerification || PROFESSOR_STATUS.VALIDE;
        const newMotif = user?.motifRejetVerification || null;
        storeProfessorStatus(newStatus, newMotif);
        if (newStatus === PROFESSOR_STATUS.VALIDE) {
          try {
            // Nouveau jeton portant ROLE_PROFESSOR
            await switchRoleWithToken("PROFESSOR");
          } catch (e) {
            // Le serveur recalcule les droits à chaque requête : le jeton actuel suffit
            console.warn("Ré-émission du jeton après validation impossible :", e);
          }
          onValidated();
          return;
        }
        onStatusChange(newStatus, newMotif);
        if (!silent && newStatus === status) {
          setInfo("Votre statut n'a pas changé.");
        }
      } catch (err) {
        if (!silent) {
          setError(err?.message || "Impossible de vérifier votre statut. Réessayez plus tard.");
        }
      } finally {
        inFlight.current = false;
        if (!silent) setRefreshing(false);
      }
    },
    [userId, status, onStatusChange, onValidated],
  );

  // Toujours conserver la dernière version pour les écouteurs
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Chargement initial, rafraîchissement périodique et au retour sur la fenêtre
  useEffect(() => {
    refreshRef.current({ silent: true });
    const interval = setInterval(() => refreshRef.current({ silent: true }), REFRESH_INTERVAL_MS);
    const onFocus = () => refreshRef.current({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Notifications temps réel (WebSocket via NotificationIcon / useNotifications)
  const notifications = useSelector((state) => state.notifications?.notifications || []);
  const seenNotificationIds = useRef(null);
  useEffect(() => {
    const ids = notifications.map((n) => n.id);
    if (seenNotificationIds.current === null) {
      seenNotificationIds.current = new Set(ids);
      return;
    }
    const fresh = notifications.filter((n) => !seenNotificationIds.current.has(n.id));
    ids.forEach((id) => seenNotificationIds.current.add(id));
    if (fresh.some((n) => PROFESSOR_STATUS_NOTIFICATION_TYPES.includes(n.type))) {
      refreshRef.current({ silent: true });
    }
  }, [notifications]);

  const handleSwitchRole = async (role) => {
    setSwitchingRole(role);
    setError("");
    try {
      const authData = await switchRoleWithToken(role);
      const dashName = dashboardNameForRole(authData.selectedRole || role);
      window.location.href = `/schoolchat/Principal/${dashName}/activities`;
    } catch (err) {
      setError(err?.message || "Impossible de changer de profil.");
      setSwitchingRole(null);
    }
  };

  const content = STATUS_CONTENT[status] || STATUS_CONTENT[PROFESSOR_STATUS.EN_ATTENTE_VALIDATION];
  const badge = getProfessorStatusDisplay(status);
  const isRejected = status === PROFESSOR_STATUS.REJETE;
  const showForm = status === PROFESSOR_STATUS.DOCUMENTS_MANQUANTS || isRejected;
  const motifToShow = motif || profile?.motifRejetVerification;

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900 text-gray-100" : "bg-gray-50 text-slate-800"}`}>
      <header className={`sticky top-0 z-20 border-b ${isDark ? "bg-slate-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-indigo-600 leading-tight">ScholChat</p>
            <p className="text-xs text-slate-500 truncate">
              {userName || "Professeur"}
              {userEmail ? ` - ${userEmail}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationIcon />
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Mon profil et paramètres"
            >
              <FontAwesomeIcon icon={showSettings ? faArrowLeft : faUserGear} />
              <span className="hidden sm:inline">{showSettings ? "Retour" : "Mon profil"}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Déconnexion"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {showSettings && renderSettings ? (
          renderSettings()
        ) : (
          <>
            <section className={`rounded-2xl shadow-sm border p-6 ${isDark ? "bg-slate-800 border-gray-700" : "bg-white border-slate-100"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${content.iconClass}`}>
                  <FontAwesomeIcon icon={content.icon} className="text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold">{content.title}</h1>
                    {badge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{content.text}</p>
                </div>
              </div>

              {isRejected && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold mb-0.5">Motif du refus</p>
                  <p>{motifToShow || "Aucun motif précisé."}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => refresh()}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faArrowsRotate} className={refreshing ? "animate-spin" : ""} />
                  Vérifier à nouveau
                </button>
                {lastChecked && (
                  <span className="text-xs text-slate-400">
                    Dernière vérification : {lastChecked.toLocaleTimeString("fr-FR")}
                  </span>
                )}
              </div>
              {info && <p className="mt-3 text-sm text-slate-500">{info}</p>}
              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
            </section>

            {status === PROFESSOR_STATUS.EN_ATTENTE_VALIDATION && (
              <section className={`rounded-2xl shadow-sm border p-6 ${isDark ? "bg-slate-800 border-gray-700" : "bg-white border-slate-100"}`}>
                <h2 className="text-base font-semibold mb-3">Pièces reçues</h2>
                <ul className="space-y-2">
                  {PROFESSOR_DOCUMENTS.map((doc) => {
                    const received = profile ? !!profile[doc.field] : true;
                    return (
                      <li key={doc.field} className="flex items-center gap-2 text-sm">
                        <FontAwesomeIcon
                          icon={received ? faCircleCheck : faTriangleExclamation}
                          className={received ? "text-emerald-500" : "text-amber-500"}
                        />
                        <span>{doc.label}</span>
                        <span className="text-xs text-slate-400">
                          {received ? "Reçu" : "Non reçu"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {showForm && (
              <section className={`rounded-2xl shadow-sm border p-6 ${isDark ? "bg-slate-800 border-gray-700" : "bg-white border-slate-100"}`}>
                <h2 className="text-base font-semibold mb-1">
                  {isRejected ? "Déposer de nouvelles pièces" : "Déposer mes pièces"}
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  {isRejected
                    ? "Remplacez au moins une pièce. Vos pièces seront à nouveau examinées par l'administrateur."
                    : "Formats image acceptés. Assurez-vous que les informations de votre CNI sont lisibles."}
                </p>
                <DocumentsForm
                  userId={userId}
                  profile={profile}
                  rejected={isRejected}
                  onSubmitted={async () => {
                    await refresh({ silent: true });
                    setInfo("Vos pièces ont bien été envoyées.");
                  }}
                />
              </section>
            )}

            {otherRoles.length > 0 && (
              <section className={`rounded-2xl shadow-sm border p-6 ${isDark ? "bg-slate-800 border-gray-700" : "bg-white border-slate-100"}`}>
                <h2 className="text-base font-semibold mb-1">Utiliser un autre profil</h2>
                <p className="text-sm text-slate-500 mb-3">
                  En attendant la validation, vous pouvez continuer avec un autre de vos profils.
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      disabled={!!switchingRole}
                      onClick={() => handleSwitchRole(role)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                    >
                      <FontAwesomeIcon
                        icon={switchingRole === role ? faSpinner : role === "PARENT" || role === "STUDENT" ? faUser : faShuffle}
                        className={switchingRole === role ? "animate-spin" : ""}
                      />
                      {ROLE_LABELS[role] || role}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ProfessorVerificationStatus;
