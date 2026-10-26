import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { scholchatService } from "../../../../../services/ScholchatService";
import { useAuth } from "../../../../../hooks/useAuth";
import { useTranslation } from "../../../../../hooks/useTranslation";
import "../../../../../CSS/settings.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCheckDouble,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFloppyDisk,
  faGear,
  faGlobe,
  faIdBadge,
  faIdCard,
  faKey,
  faLocationDot,
  faLock,
  faMoon,
  faPalette,
  faPen,
  faPhone,
  faPlus,
  faRightFromBracket,
  faRotate,
  faShield,
  faSignature,
  faSpinner,
  faSun,
  faUser,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import AddRoleModal from "../../../../../components/modals/AddRoleModal";
import { ROLE_CONFIG } from "../../../../../components/modals/RoleSelectorModal";
import {
  STUDENT_SWITCH_HINT,
  accountHasOtherRoles,
  getStoredAddableRoles,
  isStudentSession,
  normalizeRoleName,
} from "../../../../../utils/roleRules";
import { ROLE_STATUS, ROLE_STATUS_META, buildRoleStatuses } from "../../../../../utils/roleStatus";
import { refreshSessionRoles } from "../../../../../utils/authSession";
import ProfessorDocumentsPanel, {
  getVerificationLabel,
  useResolvedMediaUrl,
} from "../../../../../components/profile/ProfessorDocumentsPanel";

// normalizedUserRole (useAuth) -> French label
const ROLE_LABELS = {
  admin: "Administrateur",
  professor: "Professeur",
  tutor: "Répétiteur",
  parent: "Parent",
  student: "Élève",
  gestionnaire: "Gestionnaire",
};

// Backend EtatUtilisateur -> badge
const ETAT_BADGES = {
  ACTIVE: { label: "Compte actif", light: "bg-green-100 text-green-800", dark: "bg-green-900/50 text-green-300" },
  AWAITING_VALIDATION: { label: "En attente de validation", light: "bg-amber-100 text-amber-800", dark: "bg-amber-900/50 text-amber-300" },
  PENDING: { label: "En attente", light: "bg-amber-100 text-amber-800", dark: "bg-amber-900/50 text-amber-300" },
  INACTIVE: { label: "Compte inactif", light: "bg-gray-200 text-gray-700", dark: "bg-gray-700 text-gray-300" },
  REJECTED: { label: "Compte rejeté", light: "bg-red-100 text-red-800", dark: "bg-red-900/50 text-red-300" },
  SUSPECT: { label: "Compte signalé", light: "bg-red-100 text-red-800", dark: "bg-red-900/50 text-red-300" },
  SIGNALE: { label: "Compte signalé", light: "bg-red-100 text-red-800", dark: "bg-red-900/50 text-red-300" },
};

// Mirrors the backend password policy (POST /auth/change-password)
const PASSWORD_RULES = [
  { label: "8 caractères minimum", test: (v) => v.length >= 8 },
  { label: "Une lettre majuscule (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "Une lettre minuscule (a-z)", test: (v) => /[a-z]/.test(v) },
  { label: "Un chiffre (0-9)", test: (v) => /[0-9]/.test(v) },
  { label: "Un caractère spécial (!@#$%...)", test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v) },
];

const COLOR_SCHEMES = {
  blue: { name: "Bleu", primary: "#3b82f6", light: "#60a5fa", gradient: "from-blue-500 to-blue-600" },
  green: { name: "Vert", primary: "#10b981", light: "#34d399", gradient: "from-green-500 to-green-600" },
  purple: { name: "Violet", primary: "#8b5cf6", light: "#a78bfa", gradient: "from-purple-500 to-purple-600" },
  orange: { name: "Orange", primary: "#f59e0b", light: "#fbbf24", gradient: "from-orange-500 to-orange-600" },
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

const isValidPhone = (v) => {
  const digits = v.replace(/\D/g, "");
  return /^\+?[0-9\s\-().]+$/.test(v) && digits.length >= 8 && digits.length <= 15;
};

const readStoredRoles = () => {
  let available = [];
  let authResponse = {};
  try {
    available = JSON.parse(localStorage.getItem("availableRoles") || "[]") || [];
  } catch {
    available = [];
  }
  try {
    authResponse = JSON.parse(localStorage.getItem("authResponse") || "{}") || {};
  } catch {
    authResponse = {};
  }
  const current = normalizeRoleName(localStorage.getItem("userRole"));
  const roles = available.length > 0 ? available : current ? [current] : [];
  return { roles, available, authResponse, current };
};

const SettingsThemeContext = createContext(false);

const themeClasses = (isDark) => ({
  cardClass: `rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`,
  textClass: isDark ? "text-white" : "text-gray-900",
  subClass: isDark ? "text-gray-300" : "text-gray-600",
  mutedClass: isDark ? "text-gray-400" : "text-gray-500",
  dividerClass: isDark ? "divide-gray-700" : "divide-gray-100",
});

// Helper components live at module level (stable identities: inputs keep focus while typing).
const useThemeClasses = () => {
  const isDark = useContext(SettingsThemeContext);
  return { isDark, ...themeClasses(isDark) };
};

const MessageBanner = ({ msg }) => {
  const { isDark } = useThemeClasses();
  return msg.text ? (
    <div
      className={`p-3 sm:p-4 rounded-xl border flex items-center gap-3 ${msg.type === "success" ? (isDark ? "bg-green-900/25 border-green-800 text-green-300" : "bg-green-50 border-green-200 text-green-700") : isDark ? "bg-red-900/25 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}
    >
      <FontAwesomeIcon icon={msg.type === "success" ? faCircleCheck : faCircleExclamation} className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{msg.text}</span>
    </div>
  ) : null;
};

const SectionCard = ({ icon, title, right, children, className = "" }) => {
  const { cardClass, textClass } = useThemeClasses();
  return (
    <section className={`${cardClass} p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className={`flex items-center gap-2 text-base sm:text-lg font-bold ${textClass} min-w-0`}>
          <FontAwesomeIcon icon={icon} className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
};

const BannerCard = ({ from, icon, title, subtitle }) => {
  const { cardClass, textClass, subClass } = useThemeClasses();
  return (
    <div className={`${cardClass} p-4 sm:p-5 flex items-center gap-3`}>
      <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${from} flex items-center justify-center shadow`}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <h2 className={`text-base sm:text-lg font-extrabold ${textClass}`}>{title}</h2>
        <p className={`text-xs sm:text-sm ${subClass}`}>{subtitle}</p>
      </div>
    </div>
  );
};

const Field = ({ label, icon, value, onChange, editable, type = "text", multiline, placeholder, hint, error, secure }) => {
  const { isDark, textClass, mutedClass } = useThemeClasses();
  const [shown, setShown] = useState(false);
  const box = `flex items-center gap-3 px-3 rounded-xl border-2 min-h-[46px] ${editable ? (isDark ? "bg-gray-700 border-gray-600 focus-within:border-blue-500" : "bg-white border-blue-200 focus-within:border-blue-500") : isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${multiline ? "items-start py-2.5" : ""} ${error ? "!border-red-300" : ""}`;
  return (
    <div className="mb-3">
      <label className={`block text-sm font-semibold mb-1.5 ${textClass}`}>{label}</label>
      <div className={box}>
        {icon && <FontAwesomeIcon icon={icon} className={`w-3.5 h-3.5 flex-shrink-0 ${mutedClass} ${multiline ? "mt-1" : ""}`} />}
        {editable ? (
          multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder={placeholder}
              className={`flex-1 min-w-0 bg-transparent outline-none resize-none text-sm ${textClass}`}
            />
          ) : (
            <input
              type={secure ? (shown ? "text" : "password") : type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              autoComplete={secure ? "new-password" : undefined}
              className={`flex-1 min-w-0 bg-transparent outline-none py-2.5 text-sm ${textClass}`}
            />
          )
        ) : (
          <span className={`flex-1 min-w-0 py-2.5 text-sm font-medium break-words ${value ? textClass : mutedClass}`}>
            {value || "Non renseigné"}
          </span>
        )}
        {secure && (
          <button type="button" onClick={() => setShown((v) => !v)} className={mutedClass} aria-label={shown ? "Masquer" : "Afficher"}>
            <FontAwesomeIcon icon={shown ? faEyeSlash : faEye} className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
      {hint && <p className={`mt-1 text-xs ${mutedClass}`}>{hint}</p>}
    </div>
  );
};

const InfoRow = ({ label, value }) => {
  const { textClass, subClass } = useThemeClasses();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className={`text-sm ${subClass}`}>{label}</dt>
      <dd className={`text-sm font-semibold text-right break-words ${textClass}`}>{value}</dd>
    </div>
  );
};

const StatusRow = ({ label, tone, icon }) => {
  const { isDark } = useThemeClasses();
  const tones = {
    success: isDark ? "bg-green-900/25 text-green-300" : "bg-green-100 text-green-800",
    warning: isDark ? "bg-amber-900/25 text-amber-300" : "bg-amber-100 text-amber-800",
    info: isDark ? "bg-blue-900/25 text-blue-300" : "bg-blue-100 text-blue-800",
  };
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl mb-2 ${tones[tone]}`}>
      <span className="text-sm font-semibold">{label}</span>
      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
    </div>
  );
};

const STATUS_PILLS = {
  success: { light: "bg-emerald-100 text-emerald-800", dark: "bg-emerald-900/40 text-emerald-300" },
  warning: { light: "bg-amber-100 text-amber-800", dark: "bg-amber-900/40 text-amber-300" },
  neutral: { light: "bg-slate-200 text-slate-700", dark: "bg-slate-700 text-slate-200" },
  danger: { light: "bg-red-100 text-red-700", dark: "bg-red-900/40 text-red-300" },
};

// One profile of the account with its status ("Mes profils").
const ProfileRow = ({ entry, isCurrent, action }) => {
  const { isDark, textClass, mutedClass } = useThemeClasses();
  const cfg = ROLE_CONFIG[normalizeRoleName(entry.role)];
  const Icon = cfg?.icon;
  const meta = ROLE_STATUS_META[entry.status] || ROLE_STATUS_META.PENDING;
  const pill = STATUS_PILLS[meta.tone] || STATUS_PILLS.neutral;
  const active = entry.status === ROLE_STATUS.ACTIVE;
  const pendingHint =
    entry.status === ROLE_STATUS.PENDING
      ? normalizeRoleName(entry.role) === "STUDENT"
        ? `En attente de l'approbation du professeur de la classe${entry.classeNom ? ` « ${entry.classeNom} »` : ""}.`
        : normalizeRoleName(entry.role) === "PROFESSOR"
          ? "Vos documents sont en cours de vérification par l'administration."
          : null
      : entry.status === ROLE_STATUS.DOCS_MISSING
        ? "Ajoutez vos pièces d'identité pour que la demande soit examinée."
        : null;
  return (
    <div className="py-2.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${active ? cfg?.color || "bg-blue-500" : "bg-gray-400"}`}>
          {Icon ? <Icon className="w-4 h-4 text-white" /> : <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`truncate font-semibold ${textClass}`}>
            {cfg?.label || entry.role}
            {isCurrent && <span className={`ml-2 text-xs font-medium ${mutedClass}`}>(profil actuel)</span>}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap ${isDark ? pill.dark : pill.light}`}>{meta.label}</span>
      </div>
      {(pendingHint || (entry.status === ROLE_STATUS.REJECTED && entry.motif) || action) && (
        <div className="pl-12 mt-1 space-y-1">
          {pendingHint && <p className={`text-xs ${mutedClass}`}>{pendingHint}</p>}
          {entry.status === ROLE_STATUS.REJECTED && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Motif : {entry.motif || "non précisé"}
            </p>
          )}
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Paramètres / profil — same layout and features as the mobile AccountSettingsBody:
 * header card, profile card (avatar, name, e-mail, role / account / verification badges),
 * Mon Profil / Sécurité / Apparence tabs; the profile tab holds personal + contact info
 * (editable), account details, "Mes profils" (switch / add a profile) and, for a
 * professor, the verification documents (preview + replace → re-verification).
 * Data: GET/PATCH /utilisateurs/{id}; password: POST /auth/change-password.
 */
const SettingsContent = ({
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
  onSwitchProfile,
  onLogout,
  focusSection,
  focusKey,
}) => {
  const { updateProfile, normalizedUserRole } = useAuth();
  const { language, changeLanguage } = useTranslation();
  const roleLabel = ROLE_LABELS[normalizedUserRole] || "Utilisateur";
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [pwMessage, setPwMessage] = useState({ text: "", type: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [addRoleMode, setAddRoleMode] = useState(null); // null | "docs" (re-send professor documents)
  const [, setRolesVersion] = useState(0);
  const profilesRef = useRef(null);
  const studentSession = isStudentSession();
  const [profileData, setProfileData] = useState({ nom: "", prenom: "", telephone: "", adresse: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const scheme = COLOR_SCHEMES[currentTheme] || COLOR_SCHEMES.blue;
  const gradient = scheme.gradient;
  const isProfessor = normalizedUserRole === "professor" || normalizedUserRole === "tutor";
  const isStudent = userProfile?.type === "eleve";
  const avatarUrl = useResolvedMediaUrl(userProfile?.selfieUrl || userProfile?.fullPicUrl || "");
  const etatBadge = userProfile?.etat ? ETAT_BADGES[userProfile.etat] : null;
  const verificationLabel = isProfessor ? getVerificationLabel(userProfile?.statutVerification) : null;
  const memberSince = formatDate(userProfile?.creationDate);
  const displayName = [userProfile?.prenom, userProfile?.nom].filter(Boolean).join(" ") || "Utilisateur";
  const initials = `${userProfile?.prenom?.charAt(0) || ""}${userProfile?.nom?.charAt(0) || ""}`.toUpperCase() || "U";
  const email = userProfile?.email || localStorage.getItem("userEmail") || "";

  // Fills the form from a backend user and keeps the header (redux auth user +
  // localStorage "username") in sync.
  const applyProfile = (user) => {
    setUserProfile(user);
    setProfileData({
      nom: user.nom || "",
      prenom: user.prenom || "",
      telephone: user.telephone || "",
      adresse: user.adresse || "",
    });
    const fullName = [user.prenom, user.nom].filter(Boolean).join(" ");
    if (fullName) {
      localStorage.setItem("userName", fullName);
      updateProfile({ username: fullName, name: fullName, phone: user.telephone || "" });
    }
  };

  const loadUserProfile = async () => {
    try {
      // The login response stores the id as localStorage "userId".
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Utilisateur non identifié. Veuillez vous reconnecter.");
      const user = await scholchatService.getUserById(userId);
      if (user) applyProfile(user);
      setLoadError("");
    } catch (error) {
      console.error("Error loading profile:", error);
      setLoadError(error.message || "Erreur lors du chargement du profil");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadUserProfile().finally(() => setLoading(false));
    // Up-to-date profiles list (e.g. professor profile just validated). Not in a STUDENT
    // session: the backend refuses switch-role there.
    if (!isStudentSession()) {
      refreshSessionRoles().then((data) => data && setRolesVersion((v) => v + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opened from a role notification / "Voir mes profils": show the "Mes profils" card.
  useEffect(() => {
    if (focusSection !== "profils" || loading) return;
    setActiveTab("profile");
    const t = setTimeout(() => profilesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, [focusSection, focusKey, loading]); // focusKey: a new click while already on Settings

  const startEdit = () => {
    setMessage({ text: "", type: "" });
    setEditMode(true);
  };

  const cancelEdit = () => {
    if (userProfile) applyProfile(userProfile);
    setMessage({ text: "", type: "" });
    setEditMode(false);
  };

  const handleProfileUpdate = async () => {
    const prenom = profileData.prenom.trim();
    const nom = profileData.nom.trim();
    const telephone = profileData.telephone.trim();
    const adresse = profileData.adresse.trim();
    if (!prenom || !nom) {
      setMessage({ text: "Le prénom et le nom sont obligatoires.", type: "error" });
      return;
    }
    if (telephone && !isValidPhone(telephone)) {
      setMessage({ text: "Numéro de téléphone invalide.", type: "error" });
      return;
    }
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });
      const userId = localStorage.getItem("userId");
      // `type` is required by the backend's @JsonTypeInfo discriminator;
      // "utilisateur" limits the update to the common fields. Email is the
      // login identity and stays read-only. Blank values are ignored.
      const updated = await scholchatService.patchUser(userId, {
        type: "utilisateur",
        prenom,
        nom,
        ...(telephone ? { telephone } : {}),
        ...(adresse ? { adresse } : {}),
      });
      if (updated) applyProfile(updated);
      setMessage({ text: "Profil mis à jour avec succès", type: "success" });
      setEditMode(false);
    } catch (error) {
      setMessage({ text: error.message || "Erreur lors de la mise à jour du profil", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const passwordChecks = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(passwordData.newPassword) }));
  const passwordsMatch =
    passwordData.confirmPassword.length > 0 && passwordData.newPassword === passwordData.confirmPassword;
  const canSubmitPassword =
    !!passwordData.currentPassword && passwordChecks.every((c) => c.ok) && passwordsMatch && !changingPassword;

  const handlePasswordChange = async () => {
    if (!canSubmitPassword) return;
    try {
      setChangingPassword(true);
      setPwMessage({ text: "", type: "" });
      await scholchatService.changePassword(passwordData);
      setPwMessage({ text: "Mot de passe modifié avec succès", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPwMessage({ text: error.message || "Erreur lors du changement de mot de passe", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    setMessage({ text: "", type: "" });
    setPwMessage({ text: "", type: "" });
  };

  const { cardClass, textClass, subClass, mutedClass, dividerClass } = themeClasses(isDark);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin text-blue-600" />
          <span className={textClass}>Chargement des paramètres...</span>
        </div>
      </div>
    );
  }

  const { roles, available, authResponse, current } = readStoredRoles();
  const roleStatuses = buildRoleStatuses({ profile: userProfile, authResponse, availableRoles: available, sessionRole: current });
  const canSwitch = !studentSession && !!onSwitchProfile && roles.length > 1;
  const canAdd = normalizedUserRole !== "admin" && !studentSession && getStoredAddableRoles().length > 0;
  const showStudentHint = studentSession && accountHasOtherRoles();

  const TABS = [
    { id: "profile", label: "Mon Profil", icon: faUser },
    { id: "security", label: "Sécurité", icon: faLock },
    { id: "appearance", label: "Apparence", icon: faPalette },
  ];

  return (
    <SettingsThemeContext.Provider value={!!isDark}>
    <div className="transition-all duration-300">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-5">
        {/* ── Header ── */}
        <div className={`${cardClass} p-4 sm:p-5 flex items-center gap-3`}>
          <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
            <FontAwesomeIcon icon={faGear} className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-lg sm:text-2xl font-extrabold ${textClass}`}>Paramètres</h1>
            <p className={`text-xs sm:text-sm ${subClass} truncate`}>Gérez votre profil, votre sécurité et vos préférences</p>
          </div>
        </div>

        {loadError && <MessageBanner msg={{ text: loadError, type: "error" }} />}

        {/* ── Profile card ── */}
        <div className={`${cardClass} p-4 sm:p-5 flex items-center gap-4`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={initials} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow flex-shrink-0" />
          ) : (
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow flex-shrink-0`}>
              <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className={`text-lg sm:text-xl font-extrabold truncate ${textClass}`}>{displayName}</h2>
            {email && <p className={`text-sm truncate ${subClass}`}>{email}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isDark ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800"}`}>
                <FontAwesomeIcon icon={faShield} className="w-2.5 h-2.5" />
                {roleLabel}
              </span>
              {etatBadge && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isDark ? etatBadge.dark : etatBadge.light}`}>{etatBadge.label}</span>
              )}
              {verificationLabel && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${userProfile?.statutVerification === "VALIDE" ? (isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-800") : isDark ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-800"}`}>
                  Profil professeur : {verificationLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={`${cardClass} p-1 flex gap-1`} role="tablist">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${active ? `bg-gradient-to-r ${gradient} text-white shadow` : `${subClass} ${isDark ? "hover:bg-gray-700/60" : "hover:bg-gray-50"}`}`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <>
            <MessageBanner msg={message} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <SectionCard
                icon={faUser}
                title="Informations personnelles"
                right={
                  !editMode && (
                    <button
                      onClick={startEdit}
                      disabled={!userProfile}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800"}`}
                    >
                      <FontAwesomeIcon icon={faPen} className="w-2.5 h-2.5" />
                      Modifier
                    </button>
                  )
                }
              >
                <Field label="Prénom" icon={faUser} value={profileData.prenom} editable={editMode}
                  onChange={(v) => setProfileData((d) => ({ ...d, prenom: v }))} placeholder="Votre prénom" />
                <Field label="Nom" icon={faSignature} value={profileData.nom} editable={editMode}
                  onChange={(v) => setProfileData((d) => ({ ...d, nom: v }))} placeholder="Votre nom" />
                <Field label="Adresse e-mail" icon={faEnvelope} value={email} editable={false}
                  hint={editMode ? "L'e-mail est votre identifiant de connexion et ne peut pas être modifié ici." : undefined} />
              </SectionCard>

              <SectionCard icon={faPhone} title="Coordonnées">
                <Field label="Téléphone" icon={faPhone} type="tel" value={profileData.telephone} editable={editMode}
                  onChange={(v) => setProfileData((d) => ({ ...d, telephone: v }))} placeholder="6XXXXXXXX" />
                <Field label="Adresse" icon={faLocationDot} multiline value={profileData.adresse} editable={editMode}
                  onChange={(v) => setProfileData((d) => ({ ...d, adresse: v }))} placeholder="Votre adresse complète" />
              </SectionCard>
            </div>

            {editMode && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className={`px-6 py-3 rounded-xl font-semibold border ${isDark ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"} disabled:opacity-50`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${gradient} shadow disabled:opacity-60`}
                >
                  <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <SectionCard icon={faIdCard} title="Détails du compte">
                <dl className={`divide-y ${dividerClass}`}>
                  <InfoRow label="Rôle" value={roleLabel} />
                  {etatBadge && <InfoRow label="Statut" value={etatBadge.label} />}
                  {memberSince && <InfoRow label="Membre depuis" value={memberSince} />}
                  {isProfessor && <InfoRow label="Matricule" value={userProfile?.matriculeProfesseur || "Non renseigné"} />}
                  {verificationLabel && <InfoRow label="Statut de vérification" value={verificationLabel} />}
                  {isStudent && <InfoRow label="Niveau" value={userProfile?.niveau || "Non renseigné"} />}
                </dl>
              </SectionCard>

              {normalizedUserRole !== "admin" && (
                <div ref={profilesRef} id="mes-profils">
                <SectionCard icon={faUsersGear} title="Mes profils">
                  <div className={`divide-y ${dividerClass}`}>
                    {roleStatuses.map((entry) => {
                      const needsDocs =
                        normalizeRoleName(entry.role) === "PROFESSOR" &&
                        (entry.status === ROLE_STATUS.DOCS_MISSING || entry.status === ROLE_STATUS.REJECTED);
                      return (
                        <ProfileRow
                          key={entry.role}
                          entry={entry}
                          isCurrent={normalizeRoleName(entry.role) === current}
                          action={
                            needsDocs && !studentSession ? (
                              <button
                                onClick={() => {
                                  setAddRoleMode("docs");
                                  setShowAddRole(true);
                                }}
                                className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                              >
                                <FontAwesomeIcon icon={faIdCard} className="w-3 h-3" />
                                {entry.status === ROLE_STATUS.REJECTED ? "Renvoyer mes documents" : "Ajouter mes documents"}
                              </button>
                            ) : null
                          }
                        />
                      );
                    })}
                  </div>
                  {showStudentHint && (
                    <p className={`flex items-start gap-2 text-xs mt-3 p-3 rounded-xl ${isDark ? "bg-indigo-900/30 text-indigo-200" : "bg-indigo-50 text-indigo-800"}`}>
                      <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
                      <span>{STUDENT_SWITCH_HINT}</span>
                    </p>
                  )}
                  {(canSwitch || canAdd) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {canSwitch && (
                        <button
                          onClick={onSwitchProfile}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <FontAwesomeIcon icon={faRotate} className="w-3 h-3" />
                          Changer de profil
                        </button>
                      )}
                      {canAdd && (
                        <button
                          onClick={() => {
                            setAddRoleMode(null);
                            setShowAddRole(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                          Ajouter un profil
                        </button>
                      )}
                    </div>
                  )}
                </SectionCard>
                </div>
              )}
            </div>

            {isProfessor && (
              <SectionCard icon={faIdBadge} title="Documents de vérification">
                {userProfile ? (
                  <ProfessorDocumentsPanel
                    profile={userProfile}
                    isDark={isDark}
                    onUpdated={async () => {
                      await loadUserProfile();
                    }}
                  />
                ) : (
                  <p className={`text-sm ${mutedClass}`}>Aucun document transmis.</p>
                )}
              </SectionCard>
            )}
          </>
        )}

        {/* ── Security tab ── */}
        {activeTab === "security" && (
          <>
            <BannerCard from="from-red-500 to-orange-500" icon={faShield} title="Sécurité du compte"
              subtitle="Protégez votre compte avec un mot de passe sécurisé" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
              <SectionCard icon={faLock} title="État de sécurité">
                <StatusRow label="Mot de passe" tone="success" icon={faCircleCheck} />
                <StatusRow
                  label={userProfile?.etat === "ACTIVE" ? "Compte activé" : etatBadge?.label || "Statut inconnu"}
                  tone={userProfile?.etat === "ACTIVE" ? "success" : "warning"}
                  icon={userProfile?.etat === "ACTIVE" ? faCircleCheck : faCircleExclamation}
                />
                <StatusRow label="Connexion sécurisée" tone="info" icon={faShield} />
              </SectionCard>

              <SectionCard icon={faKey} title="Modifier le mot de passe" className="lg:col-span-2">
                <Field label="Mot de passe actuel" icon={faKey} value={passwordData.currentPassword} editable secure
                  onChange={(v) => setPasswordData((d) => ({ ...d, currentPassword: v }))} placeholder="Entrez votre mot de passe actuel" />
                <Field label="Nouveau mot de passe" icon={faLock} value={passwordData.newPassword} editable secure
                  onChange={(v) => setPasswordData((d) => ({ ...d, newPassword: v }))} placeholder="Entrez votre nouveau mot de passe" />
                {passwordData.newPassword && (
                  <div className={`rounded-xl p-3 -mt-1 mb-3 space-y-1.5 ${isDark ? "bg-gray-900/40" : "bg-gray-100"}`}>
                    {passwordChecks.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <FontAwesomeIcon icon={c.ok ? faCircleCheck : faCircle} className={`w-3 h-3 ${c.ok ? "text-green-600" : mutedClass}`} />
                        <span className={`text-xs ${c.ok ? "text-green-600" : subClass}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Confirmer le nouveau mot de passe" icon={faCheckDouble} value={passwordData.confirmPassword} editable secure
                  onChange={(v) => setPasswordData((d) => ({ ...d, confirmPassword: v }))} placeholder="Confirmez votre nouveau mot de passe"
                  error={passwordData.confirmPassword && !passwordsMatch ? "Les mots de passe ne correspondent pas" : undefined} />
                <button
                  onClick={handlePasswordChange}
                  disabled={!canSubmitPassword}
                  className={`w-full mt-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${gradient} shadow disabled:opacity-50`}
                >
                  <FontAwesomeIcon icon={changingPassword ? faSpinner : faLock} className={`w-4 h-4 ${changingPassword ? "animate-spin" : ""}`} />
                  {changingPassword ? "Modification en cours..." : "Modifier le mot de passe"}
                </button>
                {pwMessage.text && (
                  <div className="mt-3">
                    <MessageBanner msg={pwMessage} />
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}

        {/* ── Appearance tab ── */}
        {activeTab === "appearance" && (
          <>
            <BannerCard from="from-purple-500 to-pink-500" icon={faPalette} title="Personnalisation"
              subtitle="Adaptez l'interface à vos préférences visuelles" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <SectionCard icon={isDark ? faMoon : faSun} title="Mode d'affichage">
                <div className={`flex items-center gap-3 p-3.5 rounded-xl border-2 ${isDark ? "border-blue-500 bg-blue-900/20" : "border-gray-200"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-600" : "bg-yellow-500"}`}>
                    <FontAwesomeIcon icon={isDark ? faMoon : faSun} className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${textClass}`}>{isDark ? "Mode sombre" : "Mode clair"}</p>
                    <p className={`text-xs ${subClass}`}>
                      {isDark ? "Interface sombre pour réduire la fatigue oculaire" : "Interface claire et lumineuse"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isDark} onChange={() => setIsDark(!isDark)} aria-label="Mode d'affichage" />
                    <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              </SectionCard>

              <SectionCard icon={faGlobe} title="Langue">
                <div className={`flex items-center gap-3 p-3.5 rounded-xl border-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${textClass}`}>{language === "en" ? "English" : "Français"}</p>
                    <p className={`text-xs ${subClass}`}>Langue de l'interface</p>
                  </div>
                  <div className={`inline-flex rounded-lg p-0.5 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                    {["fr", "en"].map((lng) => (
                      <button
                        key={lng}
                        onClick={() => changeLanguage(lng)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold ${language === lng ? `bg-gradient-to-r ${gradient} text-white shadow` : subClass}`}
                      >
                        {lng.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            {setCurrentTheme && (
              <SectionCard icon={faPalette} title="Couleur de l'interface">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(COLOR_SCHEMES).map(([key, cfg]) => {
                    const active = currentTheme === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCurrentTheme(key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${active ? "shadow" : isDark ? "border-gray-700" : "border-gray-200"}`}
                        style={{ borderColor: active ? cfg.primary : undefined, backgroundColor: active ? `${cfg.primary}12` : undefined }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <span className="w-6 h-6 rounded-md" style={{ backgroundColor: cfg.primary }} />
                            <span className="w-6 h-6 rounded-md" style={{ backgroundColor: cfg.light }} />
                          </div>
                          {active && <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" style={{ color: cfg.primary }} />}
                        </div>
                        <p className={`mt-2 text-sm font-bold ${textClass}`}>{cfg.name}</p>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ── Logout ── */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left ${isDark ? "bg-red-900/20 border-red-900/50" : "bg-red-50 border-red-200"}`}
          >
            <span className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4 text-red-500" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-red-500">Déconnexion</span>
              <span className={`block text-xs ${subClass}`}>Se déconnecter de ScholChat sur cet appareil</span>
            </span>
            <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 text-red-500" />
          </button>
        )}
      </div>

      {!studentSession && (
        <AddRoleModal
          isOpen={showAddRole}
          onClose={() => setShowAddRole(false)}
          onRolesUpdated={() => setRolesVersion((v) => v + 1)}
          initialType={addRoleMode === "docs" ? "professeur" : null}
          docsOnly={addRoleMode === "docs"}
          onOpenProfile={async () => {
            await loadUserProfile();
            profilesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}
    </div>
    </SettingsThemeContext.Provider>
  );
};

export default SettingsContent;
