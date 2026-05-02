import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Edit,
  Trash2,
  Plus,
  Users,
  School,
  Clock,
  PowerOff,
  Check,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Eye,
  Key,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Settings,
  UserCheck,
  UserX,
  X,
  Sparkles,
  ArrowLeft,
  Trophy,
  MoreHorizontal,
  SortAsc,
  CalendarDays,
  UserPlus,
  Bell,
  Zap,
} from "lucide-react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import AccederService, {
  EtatDemandeAcces,
} from "../../../../services/accederService";
import ClassEditModal from "./ClassEditPage";
import "./ManageClassList.css";

const ManageClassListMobile = ({
  classes,
  loading,
  searchTerm,
  setSearchTerm,
  handleManageClass,
  handleEditClass,
  pendingRequests,
  onRefresh,
  onNavigateToCreate
}) => {
  return (
    <div className="flex flex-col space-y-4 px-4 pb-32 pt-2 bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-slate-950 pt-2 pb-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black dark:text-white">Mes Classes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Recherche dans vos classes</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5"
          >
            <RefreshCw size={20} className="text-blue-600" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-4 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        {classes.map((classe, idx) => {
          const pendingCount = pendingRequests[classe.id] || 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={classe.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl border border-gray-100 dark:border-white/5 relative overflow-hidden group"
            >
              {pendingCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20 z-10">
                  {pendingCount} REQUESTS
                </div>
              )}
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black dark:text-white leading-tight">{classe.nom}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{classe.niveau}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center text-[10px] font-bold text-blue-600 uppercase">
                      <CheckCircle size={10} className="mr-1" />
                      <span>{classe.etat}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                  <p className="text-sm font-bold dark:text-white">{classe.eleves?.length || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                  <p className="text-sm font-bold dark:text-white">{new Date(classe.dateCreation).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleManageClass(classe)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  MANAGE
                </button>
                <button
                  onClick={() => handleEditClass(classe)}
                  className="p-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs transition-all active:scale-95"
                >
                  <Edit size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {classes.length === 0 && (
          <div className="py-20 text-center">
            <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
              <GraduationCap size={40} className="text-gray-400" />
            </div>
            <h4 className="font-bold dark:text-white">No classes found</h4>
            <p className="text-xs text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {onNavigateToCreate && (
        <button
          onClick={onNavigateToCreate}
          className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30]"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

const ManageClassList = ({
  classes = [],
  loading = false,
  error,
  successMessage,
  refreshing = false,
  onSelectClass = () => {},
  onRefresh = () => {},
  onBack,
  onNavigateToCreate,
  userRole = "professeur",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [niveauFilter, setNiveauFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [sortBy, setSortBy] = useState("dateCreation");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pendingRequests, setPendingRequests] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(null);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationComment, setDeactivationComment] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);

  const EtatClasse = {
    ACTIF: "ACTIF",
    EN_ATTENTE_APPROBATION: "EN_ATTENTE_APPROBATION",
    INACTIF: "INACTIF",
  };

  const getStatusColor = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return "status-active";
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "status-pending";
      case EtatClasse.INACTIF:
        return "status-inactive";
      default:
        return "status-default";
    }
  };

  const getStatusText = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return "Actif";
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "En attente";
      case EtatClasse.INACTIF:
        return "Inactif";
      default:
        return "Inconnu";
    }
  };

  const getStatusIcon = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return <CheckCircle className="status-icon" />;
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return <Clock className="status-icon" />;
      case EtatClasse.INACTIF:
        return <XCircle className="status-icon" />;
      default:
        return <AlertCircle className="status-icon" />;
    }
  };

  // Load pending requests for all classes
  const loadPendingRequestsForAllClasses = async () => {
    if (!classes || classes.length === 0) return;

    try {
      setLoadingRequests(true);
      const requestsMap = {};

      // Use AccederService like ClassAccessRequests does
      for (const classe of classes) {
        try {
          const requests = await AccederService.obtenirDemandesAccesPourClasse(
            classe.id
          );
          const pendingCount = (requests || []).filter(
            (req) => req.etat === "EN_ATTENTE"
          ).length;
          requestsMap[classe.id] = pendingCount;
          console.log(`Class ${classe.nom}: ${pendingCount} pending requests`);
        } catch (err) {
          console.error(`Error loading requests for class ${classe.id}:`, err);
          requestsMap[classe.id] = 0;
        }
      }

      console.log("All pending requests:", requestsMap);
      setPendingRequests(requestsMap);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load pending requests when classes change
  useEffect(() => {
    if (classes && classes.length > 0) {
      loadPendingRequestsForAllClasses();
    }
  }, [classes]);

  // Refresh pending requests when refreshing
  useEffect(() => {
    if (refreshing) {
      loadPendingRequestsForAllClasses();
    }
  }, [refreshing]);

  const sortedAndFilteredClasses = useMemo(() => {
    let filtered = classes.filter((classe) => {
      const matchesSearch =
        classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classe.niveau.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || classe.etat === statusFilter;
      const matchesNiveau =
        niveauFilter === "all" || classe.niveau === niveauFilter;

      const matchesDate =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (new Date(classe.dateCreation) >= new Date(dateRange[0]) &&
          new Date(classe.dateCreation) <= new Date(dateRange[1]));

      return matchesSearch && matchesStatus && matchesNiveau && matchesDate;
    });

    // Sort: Classes with pending requests first, then by date
    filtered.sort((a, b) => {
      const aPendingCount = pendingRequests[a.id] || 0;
      const bPendingCount = pendingRequests[b.id] || 0;

      // First priority: classes with pending requests
      if (aPendingCount > 0 && bPendingCount === 0) return -1;
      if (aPendingCount === 0 && bPendingCount > 0) return 1;

      // If both have pending requests, sort by count (highest first)
      if (aPendingCount > 0 && bPendingCount > 0) {
        if (aPendingCount !== bPendingCount) {
          return bPendingCount - aPendingCount;
        }
      }

      // Then apply normal sorting
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "dateCreation") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "eleveCount") {
        aValue = a.eleves?.length || 0;
        bValue = b.eleves?.length || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    classes,
    searchTerm,
    statusFilter,
    niveauFilter,
    dateRange,
    sortBy,
    sortOrder,
    pendingRequests,
  ]);

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredClasses.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredClasses, currentPage, pageSize]);

  const totalClasses = classes.length;
  const activeClasses = classes.filter(
    (c) => c.etat === EtatClasse.ACTIF
  ).length;
  const pendingClasses = classes.filter(
    (c) => c.etat === EtatClasse.EN_ATTENTE_APPROBATION
  ).length;
  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.eleves?.length || 0),
    0
  );
  const totalParents = classes.reduce(
    (sum, c) => sum + (c.parents?.length || 0),
    0
  );

  // Calculate total pending requests (access requests + pending class approvals)
  const totalAccessRequests = Object.values(pendingRequests).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalPendingRequests = totalAccessRequests + pendingClasses;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setNiveauFilter("all");
    setDateRange(null);
    setSortBy("dateCreation");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const uniqueNiveaux = [...new Set(classes.map((c) => c.niveau))];

  const handleManageClass = (classe) => {
    if (onSelectClass) {
      onSelectClass(classe.id);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRefreshWithRequests = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    // Reload pending requests after refresh
    await loadPendingRequestsForAllClasses();
  };

  const handleEditClass = (classe) => {
    setEditingClass(classe);
  };

  const handleSaveEdit = async () => {
    await onRefresh();
    setEditingClass(null);
  };

  const isMobile = useSelector((state) => state.ui.isMobile);

  if (loading && classes.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader className="loading-spinner" />
          <p className="loading-text">Chargement des classes...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <ManageClassListMobile
        classes={sortedAndFilteredClasses}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleManageClass={handleManageClass}
        handleEditClass={handleEditClass}
        pendingRequests={pendingRequests}
        onRefresh={handleRefreshWithRequests}
        onNavigateToCreate={onNavigateToCreate}
      />
    );
  }

  return (
    <div className="manage-container">
      <div className="manage-wrapper">
        <div className="header-card">
          <div className="header-content">
            <div className="header-left">
              {onBack && (
                <button onClick={onBack} className="back-btn">
                  <ArrowLeft className="back-icon" />
                </button>
              )}
              <div className="header-info">
                <div className="header-icon">
                  <GraduationCap className="icon" />
                </div>
                <div className="header-text">
                  <h1 className="header-title">Gestion des Classes</h1>
                  <p className="header-subtitle">
                    Gérez et supervisez toutes les classes de votre
                    établissement
                  </p>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={handleRefreshWithRequests}
                disabled={refreshing || loadingRequests}
                className="btn btn-secondary"
              >
                <RefreshCw
                  className={`btn-icon ${
                    refreshing || loadingRequests ? "spinning" : ""
                  }`}
                />
                <span className="btn-text">
                  {refreshing || loadingRequests
                    ? "Actualisation..."
                    : "Actualiser"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="alert-icon" />
            <p className="alert-text">{error}</p>
            <button onClick={() => {}} className="alert-close">
              <X className="close-icon" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle className="alert-icon" />
            <p className="alert-text">{successMessage}</p>
            <button onClick={() => {}} className="alert-close">
              <X className="close-icon" />
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", marginTop: "-8px", flexWrap: "wrap" }}>
          {[
            { icon: <GraduationCap size={16} />, value: totalClasses, label: "Total Classes", color: "#4a6da7", bg: "#eef2fb", filter: "all" },
            { icon: <Trophy size={16} />, value: activeClasses, label: "Classes Actives", color: "#38a169", bg: "#f0fff4", filter: EtatClasse.ACTIF },
            { icon: <Bell size={16} />, value: loadingRequests ? "…" : totalPendingRequests, label: "Demandes en Attente", color: "#d97706", bg: "#fffbeb", filter: EtatClasse.EN_ATTENTE_APPROBATION },
          ].map(({ icon, value, label, color, bg, filter }) => (
            <div
              key={label}
              onClick={() => setStatusFilter(filter)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                background: "white", border: `1px solid ${color}30`,
                borderRadius: "10px", padding: "14px 32px",
                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                outline: statusFilter === filter ? `2px solid ${color}` : "none",
                transition: "all 0.2s",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ALL FILTERS ON ONE LINE */}
        <div className="filters-card">
          <div className="filters-row-all">
            <div className="search-wrapper-inline">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les statuts</option>
              <option value={EtatClasse.ACTIF}>Actif</option>
              <option value={EtatClasse.EN_ATTENTE_APPROBATION}>
                En attente
              </option>
              <option value={EtatClasse.INACTIF}>Inactif</option>
            </select>

            <select
              value={niveauFilter}
              onChange={(e) => setNiveauFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les niveaux</option>
              {uniqueNiveaux.map((niveau) => (
                <option key={niveau} value={niveau}>
                  {niveau}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value={12}>12 par page</option>
              <option value={18}>18 par page</option>
              <option value={24}>24 par page</option>
            </select>

            <button onClick={clearFilters} className="btn btn-outline">
              <X className="btn-icon" />
              <span className="btn-text">Effacer</span>
            </button>
          </div>
        </div>

        <div className="classes-card">
          {loadingRequests && (
            <div className="loading-requests-notice">
              <Loader className="loading-spinner-small" />
              <span>Chargement des demandes d'accès...</span>
            </div>
          )}

          {sortedAndFilteredClasses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-content">
                <GraduationCap className="empty-icon" />
                <h3 className="empty-title">Aucune classe trouvée</h3>
                <p className="empty-description">
                  Aucune classe ne correspond à vos critères de recherche
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="classes-grid">
                {paginatedClasses.map((classe) => {
                  const pendingCount = pendingRequests[classe.id] || 0;

                  return (
                    <div key={classe.id} className="class-card">
                      {classe.isNew && (
                        <div className="new-badge">
                          <Sparkles className="new-icon" />
                          <span>NOUVEAU</span>
                        </div>
                      )}

                      {pendingCount > 0 && (
                        <div
                          className={`pending-badge ${
                            pendingCount > 9 ? "large-count" : ""
                          }`}
                        >
                          <span>
                            {pendingCount > 99 ? "99+" : pendingCount}
                          </span>
                        </div>
                      )}

                      <div className="card-content">
                        <div className="card-header">
                          <div className="card-title-section">
                            <div className="class-info">
                              <div className="class-icon">
                                <GraduationCap className="icon" />
                              </div>
                              <div className="class-details">
                                <h3 className="class-name">{classe.nom}</h3>
                                <p className="class-level">{classe.niveau}</p>
                              </div>
                            </div>
                            <div
                              className={`status-badge ${getStatusColor(
                                classe.etat
                              )}`}
                            >
                              {getStatusIcon(classe.etat)}
                              <span>{getStatusText(classe.etat)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="date-section">
                          <Calendar className="date-icon" />
                          <span className="date-text">
                            {classe.dateCreation &&
                            classe.dateCreation !== null &&
                            classe.dateCreation !== ""
                              ? `Créée le ${new Date(
                                  classe.dateCreation
                                ).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}`
                              : "Date non disponible"}
                          </span>
                        </div>

                        <div
                          className="date-section"
                          style={{ marginTop: "8px", marginBottom: "12px" }}
                        >
                          <span className="date-text">
                            Demandes:{" "}
                            {loadingRequests ? (
                              <Loader
                                className="loading-mini-stat"
                                style={{
                                  display: "inline-block",
                                  marginLeft: "4px",
                                }}
                              />
                            ) : (
                              <strong>{pendingCount}</strong>
                            )}
                          </span>
                        </div>

                        {pendingCount > 0 && (
                          <div className="pending-requests-info">
                            <Zap className="pending-icon" />
                            <span className="pending-text">
                              {pendingCount} nouvelle
                              {pendingCount > 1 ? "s" : ""} demande
                              {pendingCount > 1 ? "s" : ""} d'accès
                            </span>
                          </div>
                        )}

                        <div className="card-actions">
                          <button
                            onClick={() => handleManageClass(classe)}
                            className="action-btn action-primary"
                          >
                            <Settings className="action-icon" />
                            <span>Gérer</span>
                          </button>
                          <button
                            onClick={() => handleEditClass(classe)}
                            className="action-btn action-secondary"
                          >
                            <Edit className="action-icon" />
                            <span>Modifier</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Math.ceil(sortedAndFilteredClasses.length / pageSize) > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Affichage de {(currentPage - 1) * pageSize + 1} à{" "}
                    {Math.min(
                      currentPage * pageSize,
                      sortedAndFilteredClasses.length
                    )}{" "}
                    sur {sortedAndFilteredClasses.length} classes
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <ChevronLeft className="pagination-icon" />
                    </button>
                    {Array.from(
                      {
                        length: Math.ceil(
                          sortedAndFilteredClasses.length / pageSize
                        ),
                      },
                      (_, i) => {
                        const page = i + 1;
                        const isCurrentPage = page === currentPage;
                        const totalPages = Math.ceil(
                          sortedAndFilteredClasses.length / pageSize
                        );
                        const shouldShow =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        if (!shouldShow) {
                          if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`pagination-btn ${
                              isCurrentPage ? "active" : ""
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(sortedAndFilteredClasses.length / pageSize)
                      }
                      className="pagination-btn"
                    >
                      <ChevronRight className="pagination-icon" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <ClassEditModal
          classe={editingClass}
          onClose={() => setEditingClass(null)}
          onSave={handleSaveEdit}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default ManageClassList;
