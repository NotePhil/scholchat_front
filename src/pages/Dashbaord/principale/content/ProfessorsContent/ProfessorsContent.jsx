import React, { useState, useEffect } from "react";
import { scholchatService } from "../../../../../services/ScholchatService";
import { minioS3Service } from "../../../../../services/minioS3";
import ProfessorModal from "../../modals/ProfessorModal";
import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal";
import UserViewModal from "../../modals/UserViewModal";
import DocumentViewer from "../../../../../components/viewers/DocumentViewer";
import { getDarkModeClasses } from "../../../../../utils/darkModeUtils";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

// Extracts relative storage key from full Wasabi/MinIO URL — never use raw URLs directly
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCalendarDays,
  faChevronDown,
  faClock,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faFileLines,
  faFilter,
  faGraduationCap,
  faHashtag,
  faHeartPulse,
  faLocationDot,
  faMagnifyingGlass,
  faPen,
  faPencil,
  faPhone,
  faShield,
  faTrashCan,
  faTriangleExclamation,
  faUserCheck,
  faUserXmark,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const toRelativePath = (raw) => {
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

// Resolves a MinIO path or raw URL into a presigned URL, with unmount safety
const ProfileAvatar = ({
  path,
  initials,
  size = "w-12 h-12",
  textSize = "text-base",
}) => {
  const [photoUrl, setPhotoUrl] = React.useState(null);
  React.useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const load = async () => {
      try {
        const url = await minioS3Service.getMediaUrlByPath(
          toRelativePath(path),
        );
        if (!cancelled && url) setPhotoUrl(url);
      } catch {
        /* ignore */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [path]);
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={initials}
        className={`${size} rounded-2xl object-cover flex-shrink-0`}
        style={{
          border: "2px solid rgba(255,255,255,0.35)",
        }}
        onError={() => setPhotoUrl(null)}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-2xl flex items-center justify-center text-white font-black ${textSize} flex-shrink-0`}
      style={{
        background: "rgba(255,255,255,0.2)",
        border: "2px solid rgba(255,255,255,0.35)",
      }}
    >
      {initials}
    </div>
  );
};

// Resolves a MinIO path for a document and renders a clickable card
const DocumentCard = ({ path, label, icon, onView }) => {
  const [resolvedUrl, setResolvedUrl] = React.useState(null);
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(path);
  const isPdf = /\.pdf(\?|$)/i.test(path);
  React.useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const load = async () => {
      try {
        const url = await minioS3Service.getMediaUrlByPath(
          toRelativePath(path),
        );
        if (!cancelled && url) setResolvedUrl(url);
      } catch {
        /* ignore */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [path]);
  const contentType = isImage ? "image" : isPdf ? "application/pdf" : "";
  return (
    <div className="group flex flex-col rounded-xl border border-slate-100 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all">
      <button
        onClick={() =>
          resolvedUrl &&
          onView({
            url: resolvedUrl,
            fileName: label,
            contentType,
          })
        }
        className="relative bg-slate-50 flex items-center justify-center w-full focus:outline-none"
        style={{
          height: 120,
        }}
        title={`Voir ${label}`}
      >
        {isImage && resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {isPdf ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-black text-sm">PDF</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Document PDF
                </span>
              </>
            ) : resolvedUrl === null && path ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">
                  {icon}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Cliquer pour voir
                </span>
              </>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-indigo-600"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>
      </button>
      <div className="px-3 py-2 flex items-center justify-between bg-white">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {resolvedUrl && (
          <a
            href={resolvedUrl}
            download={label}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Télécharger"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-slate-500"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};
const ProfessorsContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const { t } = useTranslation();
  const language = useSelector(
    (state) => state.language?.currentLanguage || "fr",
  );
  const isMobile = useSelector((state) => state.ui.isMobile);
  const [professors, setProfessors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredProfessors, setFilteredProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role.toUpperCase());
    }
    loadData();
  }, []);
  useEffect(() => {
    filterProfessors();
  }, [professors, searchTerm, filterStatus]);
  const loadData = async () => {
    try {
      setLoading(true);
      const rawRole = (localStorage.getItem("userRole") || "")
        .toUpperCase()
        .replace("ROLE_", "");
      const currentUserId = localStorage.getItem("userId");
      let allProfessors;
      if (
        rawRole === "ADMIN" ||
        rawRole === "ADMINISTRATEUR" ||
        rawRole === "GESTIONNAIRE"
      ) {
        // Admin/gestionnaire: see all professors
        allProfessors = await scholchatService.getAllProfessors();
      } else if (rawRole === "PROFESSOR" || rawRole === "PROFESSEUR") {
        // Professor: see only collaborators (professors with pub rights on their classes), excluding self
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/professeurs/moderateur/${currentUserId}/collaborateurs`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            },
          );
          allProfessors = response.ok ? await response.json() : [];
        } catch {
          allProfessors = [];
        }
      } else {
        allProfessors = [];
      }

      // Always exclude self
      const filtered = (
        Array.isArray(allProfessors) ? allProfessors : []
      ).filter((p) => p.id !== currentUserId);
      setProfessors(filtered);
    } catch (err) {
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const filterProfessors = () => {
    let filtered = professors;
    if (searchTerm) {
      filtered = filtered.filter(
        (prof) =>
          prof.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prof.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prof.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prof.matriculeProfesseur
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((prof) => prof.etat === filterStatus);
    }
    setFilteredProfessors(filtered);
  };
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
      AWAITING_VALIDATION: "bg-amber-50 text-amber-700 border-amber-200",
      SUSPECT: "bg-orange-50 text-orange-700 border-orange-200",
      SIGNALE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-blue-50 text-blue-700 border-blue-200",
      REJECTED: "bg-red-50 text-red-700 border-red-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };
  const getStatusText = (status) => {
    const texts = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      AWAITING_VALIDATION: "En attente",
      SUSPECT: "Suspect",
      SIGNALE: "Signalé",
      PENDING: "En cours",
      REJECTED: "Rejeté",
    };
    return texts[status] || status;
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
        );
      case "INACTIVE":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full"></div>
        );
      case "AWAITING_VALIDATION":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full animate-pulse"></div>
        );
      case "SUSPECT":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full"></div>
        );
      case "SIGNALE":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
        );
      case "PENDING":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
        );
      case "REJECTED":
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
        );
      default:
        return (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full"></div>
        );
    }
  };
  const handleDelete = async () => {
    try {
      setLoading(true);
      await scholchatService.deleteProfessor(selectedProfessor.id);
      await loadData();
      setShowDeleteConfirm(false);
      setSelectedProfessor(null);
    } catch (err) {
      setError("Erreur lors de la suppression: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const [viewingProfessor, setViewingProfessor] = useState(null);
  const [viewerConfig, setViewerConfig] = useState({
    isOpen: false,
    url: "",
    fileName: "",
    contentType: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motifs, setMotifs] = useState([]);
  const [selectedMotifCode, setSelectedMotifCode] = useState("");
  const [motifSupplementaire, setMotifSupplementaire] = useState("");
  const [motifsLoading, setMotifsLoading] = useState(false);
  const handleViewUser = (professor) => {
    setViewingProfessor(professor);
    setActionError("");
    setActionSuccess("");
  };
  const handleSuccess = () => {
    setIsViewModalOpen(false);
    loadData();
  };
  const handleResendActivationEmail = async (prof) => {
    try {
      setActionLoading(true);
      setActionError("");
      await scholchatService.resendActivationEmail(prof.email);
      setActionSuccess("Email d'activation renvoyé avec succès.");
    } catch (err) {
      setActionError("Erreur lors du renvoi de l'email : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  const handleValidateProfessor = async (prof) => {
    try {
      setActionLoading(true);
      setActionError("");
      await scholchatService.validateProfessor(prof.id);
      setActionSuccess("Professeur validé avec succès.");
      // Refresh the professor data
      const updated = await scholchatService.getProfessorById(prof.id);
      setViewingProfessor(updated);
      await loadData();
    } catch (err) {
      setActionError("Erreur lors de la validation : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  const openRejectModal = async () => {
    setShowRejectModal(true);
    setSelectedMotifCode("");
    setMotifSupplementaire("");
    setMotifsLoading(true);
    try {
      const data = await scholchatService.getAllMotifs();
      setMotifs(Array.isArray(data) ? data : []);
    } catch {
      setMotifs([]);
    } finally {
      setMotifsLoading(false);
    }
  };
  const handleRejectProfessor = async () => {
    if (!selectedMotifCode) return;
    try {
      setActionLoading(true);
      setActionError("");
      await scholchatService.rejectProfessor(
        viewingProfessor.id,
        selectedMotifCode,
        motifSupplementaire || undefined,
      );
      setShowRejectModal(false);
      setActionSuccess("Professeur rejeté.");
      const updated = await scholchatService.getProfessorById(
        viewingProfessor.id,
      );
      setViewingProfessor(updated);
      await loadData();
    } catch (err) {
      setActionError("Erreur lors du rejet : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };
  const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN";
  const darkClasses = getDarkModeClasses(isDark);

  // ── Professor detail view ──────────────────────────────────────────────────
  if (viewingProfessor) {
    const prof = viewingProfessor;
    const statusCfg = {
      ACTIVE: {
        label: "Actif",
        bg: "#f0fdf4",
        color: "#16a34a",
        border: "#bbf7d0",
      },
      INACTIVE: {
        label: "Inactif",
        bg: "#fef2f2",
        color: "#dc2626",
        border: "#fecaca",
      },
      AWAITING_VALIDATION: {
        label: "En attente",
        bg: "#fffbeb",
        color: "#d97706",
        border: "#fde68a",
      },
      PENDING: {
        label: "En cours",
        bg: "#eff6ff",
        color: "#2563eb",
        border: "#bfdbfe",
      },
      SUSPECT: {
        label: "Suspect",
        bg: "#fff7ed",
        color: "#ea580c",
        border: "#fed7aa",
      },
      SIGNALE: {
        label: "Signalé",
        bg: "#fef2f2",
        color: "#dc2626",
        border: "#fecaca",
      },
      REJECTED: {
        label: "Rejeté",
        bg: "#fef2f2",
        color: "#dc2626",
        border: "#fecaca",
      },
    };
    const sc = statusCfg[prof.etat] || {
      label: prof.etat,
      bg: "#f3f4f6",
      color: "#6b7280",
      border: "#e5e7eb",
    };
    return (
      <>
        <div className="full-bleed-page">
          <div className="w-full">
            {/* Hero banner */}
            <div
              className="relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4f8ec9 100%)",
              }}
            >
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                style={{
                  background: "#fff",
                }}
              />
              <div className="relative px-3 sm:px-6 py-3 sm:py-4">
                {/* Row 1: back button */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setViewingProfessor(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all hover:bg-white/20"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Retour
                  </button>
                </div>
                {/* Row 2: identity */}
                <div className="flex items-start gap-3 mb-3">
                  <ProfileAvatar
                    path={prof.selfieUrl}
                    initials={getInitials(prof.prenom, prof.nom)}
                    size="w-12 h-12 sm:w-14 sm:h-14"
                    textSize="text-base sm:text-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h1 className="text-white font-bold text-base sm:text-xl leading-tight m-0">
                        {prof.prenom} {prof.nom}
                      </h1>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                        style={{
                          background: sc.bg,
                          color: sc.color,
                          border: `1px solid ${sc.border}`,
                        }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {prof.email && (
                        <span className="text-blue-100 text-xs">
                          {prof.email}
                        </span>
                      )}
                      {prof.matriculeProfesseur && (
                        <span className="text-blue-100 text-xs">
                          #{prof.matriculeProfesseur}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Row 3: admin action buttons — centered, only for AWAITING_VALIDATION */}
                {isAdmin &&
                  (prof.etat === "AWAITING_VALIDATION" ||
                    prof.etat === "PENDING") && (
                    <div className="flex items-center justify-center gap-3 pt-1 pb-1 flex-wrap">
                      {prof.etat === "AWAITING_VALIDATION" && (
                        <>
                          <button
                            onClick={() => handleValidateProfessor(prof)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-105"
                            style={{
                              background: "#16a34a",
                              color: "#fff",
                              border: "2px solid #15803d",
                            }}
                          >
                            {actionLoading ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <FontAwesomeIcon
                                icon={faUserCheck}
                                style={{
                                  fontSize: 15,
                                }}
                              />
                            )}
                            Valider le professeur
                          </button>
                          <button
                            onClick={openRejectModal}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-105"
                            style={{
                              background: "#dc2626",
                              color: "#fff",
                              border: "2px solid #b91c1c",
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faUserXmark}
                              style={{
                                fontSize: 15,
                              }}
                            />
                            Rejeter le professeur
                          </button>
                        </>
                      )}
                      {prof.etat === "PENDING" && (
                        <button
                          onClick={() => handleResendActivationEmail(prof)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-105"
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            border: "2px solid #1d4ed8",
                          }}
                        >
                          {actionLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              style={{
                                fontSize: 15,
                              }}
                            />
                          )}
                          Renvoyer l'email d'activation
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Body */}
            <div className="px-3 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Left: personal info */}
                <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div
                      className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                      style={{
                        background: "#f8faff",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faGraduationCap}
                        className="text-indigo-600"
                        style={{
                          fontSize: 13,
                        }}
                      />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Informations
                      </span>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      {[
                        {
                          icon: (
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              style={{
                                fontSize: 13,
                              }}
                            />
                          ),
                          label: "Email",
                          value: prof.email,
                        },
                        {
                          icon: (
                            <FontAwesomeIcon
                              icon={faPhone}
                              style={{
                                fontSize: 13,
                              }}
                            />
                          ),
                          label: "Téléphone",
                          value: prof.telephone,
                        },
                        {
                          icon: (
                            <FontAwesomeIcon
                              icon={faLocationDot}
                              style={{
                                fontSize: 13,
                              }}
                            />
                          ),
                          label: "Adresse",
                          value: prof.adresse,
                        },
                        {
                          icon: (
                            <FontAwesomeIcon
                              icon={faHashtag}
                              style={{
                                fontSize: 13,
                              }}
                            />
                          ),
                          label: "Matricule",
                          value: prof.matriculeProfesseur,
                        },
                        {
                          icon: (
                            <FontAwesomeIcon
                              icon={faCalendarDays}
                              style={{
                                fontSize: 13,
                              }}
                            />
                          ),
                          label: "Créé le",
                          value: prof.creationDate
                            ? new Date(prof.creationDate).toLocaleDateString(
                                "fr-FR",
                              )
                            : null,
                        },
                      ]
                        .filter((r) => r.value)
                        .map((row, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-0.5 flex-shrink-0">
                              {row.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 font-medium">
                                {row.label}
                              </p>
                              <p className="text-sm text-slate-800 break-words">
                                {row.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      {prof.hasUploaded && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-400 font-medium mb-1.5">
                            Documents uploadés
                          </p>
                          <div className="flex items-center gap-1.5">
                            {prof.cniUrlRecto && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                                <FontAwesomeIcon
                                  icon={faFileLines}
                                  style={{
                                    fontSize: 10,
                                  }}
                                />{" "}
                                CNI ✓
                              </span>
                            )}
                            {prof.selfieUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
                                <FontAwesomeIcon
                                  icon={faEye}
                                  style={{
                                    fontSize: 10,
                                  }}
                                />{" "}
                                Selfie ✓
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Établissements */}
                  {prof.etablissementsGeres?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div
                        className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                        style={{
                          background: "#f8faff",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faShield}
                          className="text-indigo-600"
                          style={{
                            fontSize: 13,
                          }}
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Établissements
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {prof.etablissementsGeres.map((etab, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {etab.nom}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {etab.localisation}, {etab.pays}
                            </p>
                            {etab.codeUnique && (
                              <p className="text-xs text-indigo-600 mt-0.5 font-mono">
                                {etab.codeUnique}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: moderated classes */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div
                      className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
                      style={{
                        background: "#f8faff",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="text-indigo-600"
                          style={{
                            fontSize: 13,
                          }}
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Classes Modérées
                        </span>
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                          }}
                        >
                          {prof.moderatedClasses?.length || 0}
                        </span>
                      </div>
                    </div>

                    {!prof.moderatedClasses?.length ? (
                      <div className="px-4 py-10 text-center">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="text-slate-200 mx-auto mb-3"
                          style={{
                            fontSize: 32,
                          }}
                        />
                        <p className="text-slate-400 text-sm">
                          Aucune classe modérée
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {prof.moderatedClasses.map((cls, i) => (
                          <div
                            key={cls.id || i}
                            className="px-4 py-3.5 hover:bg-slate-50/60 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {cls.nom}
                                  </p>
                                  {cls.niveau && (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{
                                        background: "#e0f7fa",
                                        color: "#00838f",
                                        border: "1px solid #b2ebf2",
                                      }}
                                    >
                                      {cls.niveau}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.etat === "ACTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                  >
                                    {cls.etat}
                                  </span>
                                </div>
                                {cls.etablissement && (
                                  <p className="text-xs text-slate-500">
                                    {cls.etablissement.nom} —{" "}
                                    {cls.etablissement.localisation}
                                  </p>
                                )}
                                {cls.codeActivation && (
                                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                    Code: {cls.codeActivation}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {cls.accesMajeur && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                    Accès majeur
                                  </span>
                                )}
                                {cls.paymentRequired && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                    Payant
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents card — below Classes Modérées */}
                  {prof.hasUploaded &&
                    (prof.cniUrlRecto ||
                      prof.cniUrlVerso ||
                      prof.selfieUrl) && (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4 sm:mt-6">
                        <div
                          className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                          style={{
                            background: "#f8faff",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faFileLines}
                            className="text-indigo-600"
                            style={{
                              fontSize: 13,
                            }}
                          />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Documents d'identité
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              {
                                url: prof.cniUrlRecto,
                                label: "CNI Recto",
                                icon: "🪪",
                              },
                              {
                                url: prof.cniUrlVerso,
                                label: "CNI Verso",
                                icon: "🪪",
                              },
                              {
                                url: prof.selfieUrl,
                                label: "Selfie",
                                icon: "🤳",
                              },
                            ]
                              .filter((d) => d.url)
                              .map((doc, i) => (
                                <DocumentCard
                                  key={i}
                                  path={doc.url}
                                  label={doc.label}
                                  icon={doc.icon}
                                  onView={({ url, fileName, contentType }) =>
                                    setViewerConfig({
                                      isOpen: true,
                                      url,
                                      fileName,
                                      contentType,
                                    })
                                  }
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DocumentViewer
          isOpen={viewerConfig.isOpen}
          url={viewerConfig.url}
          fileName={viewerConfig.fileName}
          contentType={viewerConfig.contentType}
          onClose={() =>
            setViewerConfig({
              isOpen: false,
              url: "",
              fileName: "",
              contentType: "",
            })
          }
        />

        {/* Action feedback banners */}
        {(actionSuccess || actionError) && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
            {actionSuccess && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                }}
              >
                <FontAwesomeIcon
                  icon={faUserCheck}
                  style={{
                    fontSize: 16,
                  }}
                />
                {actionSuccess}
                <button
                  onClick={() => setActionSuccess("")}
                  className="ml-auto text-green-400 hover:text-green-600"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    style={{
                      fontSize: 14,
                    }}
                  />
                </button>
              </div>
            )}
            {actionError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                }}
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  style={{
                    fontSize: 16,
                  }}
                />
                {actionError}
                <button
                  onClick={() => setActionError("")}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    style={{
                      fontSize: 14,
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rejection modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
                style={{
                  background: "linear-gradient(135deg, #fef2f2 0%, #fff 100%)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faUserXmark}
                      className="text-red-600"
                      style={{
                        fontSize: 16,
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Rejeter le professeur
                    </h3>
                    <p className="text-xs text-slate-500">
                      {prof.prenom} {prof.nom}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    style={{
                      fontSize: 16,
                    }}
                  />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Motif de rejet <span className="text-red-500">*</span>
                  </label>
                  {motifsLoading ? (
                    <div className="flex items-center gap-2 py-2 text-slate-400 text-sm">
                      <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                      Chargement des motifs...
                    </div>
                  ) : motifs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Aucun motif disponible.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {motifs.map((m) => (
                        <label
                          key={m.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedMotifCode === m.code ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="motif"
                            value={m.code}
                            checked={selectedMotifCode === m.code}
                            onChange={() => setSelectedMotifCode(m.code)}
                            className="mt-0.5 accent-red-600 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700">
                              {m.code}
                            </p>
                            {m.descriptif && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {m.descriptif}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Motif supplémentaire{" "}
                    <span className="text-slate-400 font-normal">
                      (optionnel)
                    </span>
                  </label>
                  <textarea
                    value={motifSupplementaire}
                    onChange={(e) => setMotifSupplementaire(e.target.value)}
                    placeholder="Précisez si nécessaire..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none transition-all"
                  />
                </div>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectProfessor}
                  disabled={!selectedMotifCode || actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "#dc2626",
                  }}
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUserXmark}
                      style={{
                        fontSize: 14,
                      }}
                    />
                  )}
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Main list ──────────────────────────────────────────────────────────────

  if (loading && professors.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{
                clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
              }}
            ></div>
          </div>
          <p
            className={`${isDark ? "text-gray-300" : "text-slate-600"} font-medium text-sm sm:text-base`}
          >
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="w-4 h-4 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <div>
              <h1
                className={`text-xl sm:text-3xl font-bold ${isDark ? "text-white" : "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"}`}
              >
                {t("professors.title")}
              </h1>
              <p
                className={`${isDark ? "text-gray-300" : "text-slate-600"} mt-1 text-xs sm:text-sm`}
              >
                {t("professors.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 relative">
            <div
              className={`${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"} rounded-xl p-3 sm:p-4 shadow-sm`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                    />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className={`${isDark ? "text-red-400" : "text-red-800"} font-medium text-sm`}
                  >
                    Erreur
                  </p>
                  <p
                    className={`${isDark ? "text-red-300" : "text-red-700"} text-xs sm:text-sm mt-1`}
                  >
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={() => setFilterStatus("all")}
            className={`${isDark ? "bg-gray-800/70 border-gray-700/50" : "bg-white/70 border-white/50"} backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "all" ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`${isDark ? "text-gray-300" : "text-slate-600"} text-xs sm:text-sm font-medium`}
                >
                  Total
                </p>
                <p
                  className={`text-lg sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"} mt-1`}
                >
                  {professors.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <FontAwesomeIcon
                icon={faHeartPulse}
                className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2"
              />
              <span
                className={`${isDark ? "text-gray-400" : "text-slate-500"} text-xs sm:text-sm`}
              >
                Professeurs
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("ACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "ACTIVE" ? "ring-2 ring-emerald-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Actifs
                </p>
                <p className="text-lg sm:text-3xl font-bold text-emerald-600 mt-1">
                  {professors.filter((p) => p.etat === "ACTIVE").length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUserCheck}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">Validés</span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("AWAITING_VALIDATION")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "AWAITING_VALIDATION" ? "ring-2 ring-amber-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  En attente
                </p>
                <p className="text-lg sm:text-3xl font-bold text-amber-600 mt-1">
                  {
                    professors.filter((p) => p.etat === "AWAITING_VALIDATION")
                      .length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faClock}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full animate-pulse mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                Validation
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus("INACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${filterStatus === "INACTIVE" ? "ring-2 ring-red-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Inactifs
                </p>
                <p className="text-lg sm:text-3xl font-bold text-red-600 mt-1">
                  {
                    professors.filter(
                      (p) => p.etat === "INACTIVE" || p.etat === "REJECTED",
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl">
                <FontAwesomeIcon
                  icon={faUserXmark}
                  className="w-3 h-3 sm:w-6 sm:h-6 text-white"
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                Désactivés
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl ${isMobile ? "p-2" : "p-3 sm:p-6"} shadow-lg mb-6 sm:mb-8`}
        >
          <div
            className={`flex flex-col ${isMobile ? "gap-2" : "space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6"}`}
          >
            <div
              className={`relative flex-1 ${isMobile ? "max-w-full" : "max-w-full lg:max-w-md"}`}
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                style={{
                  fontSize: isMobile ? 14 : 16,
                }}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? "pl-8 pr-2 py-1.5 text-xs" : "pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base"} bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm`}
              />
            </div>

            <div
              className={`flex ${isMobile ? "flex-col gap-2" : "flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4"}`}
            >
              <div
                className={`relative ${isMobile ? "w-full" : "flex-1 min-[480px]:flex-none min-w-0"}`}
              >
                <FontAwesomeIcon
                  icon={faFilter}
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  style={{
                    fontSize: 14,
                  }}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full ${isMobile ? "pl-8 pr-5 py-1.5 text-xs" : "pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm"} bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer`}
                >
                  <option value="all">Tous</option>
                  <option value="ACTIVE">Actifs</option>
                  <option value="INACTIVE">Inactifs</option>
                  <option value="AWAITING_VALIDATION">En attente</option>
                  <option value="SUSPECT">Suspects</option>
                  <option value="SIGNALE">Signalés</option>
                  <option value="PENDING">En cours</option>
                  <option value="REJECTED">Rejetés</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  style={{
                    fontSize: 14,
                  }}
                />
              </div>

              <div
                className={`flex items-center ${isMobile ? "justify-between gap-1" : "gap-2 sm:gap-3"}`}
              >
                <button
                  onClick={loadData}
                  disabled={loading}
                  className={`${isMobile ? "p-1.5" : "p-2 sm:p-2.5"} text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Actualiser"
                >
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    className={`sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
                    style={{
                      fontSize: isMobile ? 12 : 14,
                    }}
                  />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setModalMode("create");
                      setSelectedProfessor(null);
                      setShowModal(true);
                    }}
                    className={`${isMobile ? "px-2 py-1.5" : "px-3 sm:px-4 py-2 sm:py-3"} bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2`}
                  >
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="sm:w-4 sm:h-4"
                      style={{
                        fontSize: isMobile ? 12 : 14,
                      }}
                    />
                    {!isMobile && "Ajouter"}
                  </button>
                )}

                <div className="flex bg-slate-100 rounded-lg sm:rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`${isMobile ? "px-2 py-0.5 text-[10px]" : "px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"} rounded-md sm:rounded-lg font-medium transition-all duration-200 ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Grille
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`${isMobile ? "px-2 py-0.5 text-[10px]" : "px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"} rounded-md sm:rounded-lg font-medium transition-all duration-200 ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div
            className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"}`}
          >
            {filteredProfessors.map((professor) => (
              <div
                key={professor.id}
                className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                <div className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xs sm:text-lg">
                            {getInitials(professor.prenom, professor.nom)}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          {getStatusIcon(professor.etat)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 mb-1">
                          {professor.prenom} {professor.nom}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(professor.etat)}`}
                        >
                          {getStatusText(professor.etat)}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <FontAwesomeIcon
                        icon={faEllipsisVertical}
                        className="sm:w-4 sm:h-4"
                        style={{
                          fontSize: 12,
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex-grow space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs sm:text-sm text-slate-600">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                      style={{
                        fontSize: 10,
                      }}
                    />
                    <span className="truncate">{professor.email}</span>
                  </div>

                  {professor.telephone && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                        style={{
                          fontSize: 10,
                        }}
                      />
                      <span className="truncate">{professor.telephone}</span>
                    </div>
                  )}

                  {professor.adresse && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                        style={{
                          fontSize: 10,
                        }}
                      />
                      <span className="truncate">{professor.adresse}</span>
                    </div>
                  )}

                  {(professor.peutPublier || professor.peutModerer) && (
                    <div className="pt-1 sm:pt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1 sm:mb-2">
                        Droits
                      </p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {professor.peutPublier && (
                          <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <FontAwesomeIcon
                              icon={faPencil}
                              className="sm:w-2.5 sm:h-2.5 mr-1"
                              style={{
                                fontSize: 8,
                              }}
                            />
                            Publier
                          </span>
                        )}
                        {professor.peutModerer && (
                          <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <FontAwesomeIcon
                              icon={faShield}
                              className="sm:w-2.5 sm:h-2.5 mr-1"
                              style={{
                                fontSize: 8,
                              }}
                            />
                            Modérer
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-1 sm:pt-2">
                    <p className="text-xs font-medium text-slate-500 mb-1 sm:mb-2">
                      Classes
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {professor.moderatedClasses?.length > 0 ? (
                        <>
                          {professor.moderatedClasses.slice(0, 2).map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-full"
                            >
                              {cls.nom}
                            </span>
                          ))}
                          {professor.moderatedClasses.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              +{professor.moderatedClasses.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Aucune</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-slate-100">
                  <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleViewUser(professor)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Voir les détails"
                    >
                      <FontAwesomeIcon
                        icon={faEye}
                        className="sm:w-4 sm:h-4"
                        style={{
                          fontSize: 12,
                        }}
                      />
                    </button>

                    {isAdmin && (
                      <>
                        {professor.etat === "PENDING" && (
                          <button
                            onClick={() =>
                              handleResendActivationEmail(professor)
                            }
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Renvoyer l'email d'activation"
                          >
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="sm:w-4 sm:h-4"
                              style={{
                                fontSize: 12,
                              }}
                            />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedProfessor(professor);
                            setShowModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <FontAwesomeIcon
                            icon={faPen}
                            className="sm:w-4 sm:h-4"
                            style={{
                              fontSize: 12,
                            }}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfessor(professor);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="sm:w-4 sm:h-4"
                            style={{
                              fontSize: 12,
                            }}
                          />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th
                      className={`px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Professeur
                    </th>
                    <th
                      className={`px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Contact
                    </th>
                    <th
                      className={`hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Matricule
                    </th>
                    <th
                      className={`hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Classes
                    </th>
                    <th
                      className={`px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Statut
                    </th>
                    <th
                      className={`hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Droits
                    </th>
                    <th
                      className={`px-3 sm:px-6 py-2 sm:py-4 text-right text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"} uppercase tracking-wider`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {filteredProfessors.map((professor) => (
                    <tr
                      key={professor.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-xs sm:text-sm">
                                {getInitials(professor.prenom, professor.nom)}
                              </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              {getStatusIcon(professor.etat)}
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {professor.prenom} {professor.nom}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center truncate">
                              <FontAwesomeIcon
                                icon={faLocationDot}
                                className="mr-1 flex-shrink-0"
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              <span className="truncate">
                                {professor.adresse || "Non renseigné"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm text-slate-900 flex items-center">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                              style={{
                                fontSize: 10,
                              }}
                            />
                            <span className="truncate">{professor.email}</span>
                          </div>
                          {professor.telephone && (
                            <div className="text-xs text-slate-500 flex items-center">
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              <span className="truncate">
                                {professor.telephone}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center text-xs sm:text-sm text-slate-900">
                          <FontAwesomeIcon
                            icon={faHashtag}
                            className="mr-1 text-slate-400 flex-shrink-0"
                            style={{
                              fontSize: 10,
                            }}
                          />
                          <span className="truncate">
                            {professor.matriculeProfesseur || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex flex-wrap gap-1">
                          {professor.moderatedClasses?.length > 0 ? (
                            <>
                              {professor.moderatedClasses
                                .slice(0, 2)
                                .map((cls) => (
                                  <span
                                    key={cls.id}
                                    className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate"
                                  >
                                    {cls.nom}
                                  </span>
                                ))}
                              {professor.moderatedClasses.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  +{professor.moderatedClasses.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400">
                              Aucune
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(professor.etat)}`}
                        >
                          <div
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-2 ${professor.etat === "ACTIVE" ? "bg-emerald-500" : professor.etat === "AWAITING_VALIDATION" || professor.etat === "PENDING" ? "bg-amber-500" : professor.etat === "SUSPECT" ? "bg-orange-500" : professor.etat === "SIGNALE" ? "bg-red-500" : "bg-red-500"}`}
                          ></div>
                          {getStatusText(professor.etat)}
                        </span>
                      </td>

                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {professor.peutPublier && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <FontAwesomeIcon
                                icon={faPencil}
                                className="sm:w-2.5 sm:h-2.5 mr-1"
                                style={{
                                  fontSize: 8,
                                }}
                              />
                              Publier
                            </span>
                          )}
                          {professor.peutModerer && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <FontAwesomeIcon
                                icon={faShield}
                                className="sm:w-2.5 sm:h-2.5 mr-1"
                                style={{
                                  fontSize: 8,
                                }}
                              />
                              Modérer
                            </span>
                          )}
                          {!professor.peutPublier && !professor.peutModerer && (
                            <span className="text-xs text-slate-400">
                              Aucun
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewUser(professor)}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Voir les détails"
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                              className="sm:w-4 sm:h-4"
                              style={{
                                fontSize: 12,
                              }}
                            />
                          </button>

                          {isAdmin && (
                            <>
                              {professor.etat === "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleResendActivationEmail(professor)
                                  }
                                  className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Renvoyer l'email d'activation"
                                >
                                  <FontAwesomeIcon
                                    icon={faEnvelope}
                                    className="sm:w-4 sm:h-4"
                                    style={{
                                      fontSize: 12,
                                    }}
                                  />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setModalMode("edit");
                                  setSelectedProfessor(professor);
                                  setShowModal(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Modifier"
                              >
                                <FontAwesomeIcon
                                  icon={faPen}
                                  className="sm:w-4 sm:h-4"
                                  style={{
                                    fontSize: 12,
                                  }}
                                />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProfessor(professor);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Supprimer"
                              >
                                <FontAwesomeIcon
                                  icon={faTrashCan}
                                  className="sm:w-4 sm:h-4"
                                  style={{
                                    fontSize: 12,
                                  }}
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredProfessors.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun résultat trouvé"
                  : "Aucun professeur enregistré"}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche."
                  : "Il n'y a actuellement aucun professeur dans le système."}
              </p>
            </div>
          </div>
        )}

        {loading && professors.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
                    style={{
                      clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                    }}
                  ></div>
                </div>
                <p className="text-slate-700 font-medium text-sm sm:text-base">
                  Traitement en cours...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <ProfessorModal
            showModal={showModal}
            setShowModal={setShowModal}
            modalMode={modalMode}
            selectedProfessor={selectedProfessor}
            classes={classes}
            loadData={loadData}
            setError={setError}
            setLoading={setLoading}
          />

          <DeleteConfirmationModal
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            selectedProfessor={selectedProfessor}
            handleDelete={handleDelete}
            loading={loading}
          />
        </>
      )}

      {isViewModalOpen && currentUser && (
        <UserViewModal
          user={currentUser}
          onClose={() => setIsViewModalOpen(false)}
          onSuccess={handleSuccess}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
export default ProfessorsContent;
