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
import AccederService, {
  EtatDemandeAcces,
} from "../../../../services/accederService";
import ClassEditModal from "./ClassEditPage";
import "./ManageClassList.css";

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
          const requests = await AccederService.obtenirDemandesAccesPourClasse(classe.id);
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
      
      console.log('All pending requests:', requestsMap);
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

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-header">
              <div className="stat-icon">
                <GraduationCap className="icon" />
              </div>
              <div className="stat-value">{totalClasses}</div>
            </div>
            <div className="stat-label">Total Classes</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-header">
              <div className="stat-icon">
                <Trophy className="icon" />
              </div>
              <div className="stat-value">{activeClasses}</div>
            </div>
            <div className="stat-label">Classes Actives</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-header">
              <div className="stat-icon">
                <Bell className="icon" />
              </div>
              <div className="stat-value">
                {loadingRequests ? (
                  <Loader className="loading-mini" />
                ) : (
                  totalPendingRequests
                )}
              </div>
            </div>
            <div className="stat-label">Demandes en Attente</div>
          </div>
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
                            {classe.dateCreation && !isNaN(new Date(classe.dateCreation).getTime()) ? (
                              `Créée le ${new Date(classe.dateCreation).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}`
                            ) : (
                              "Date non disponible"
                            )}
                          </span>
                        </div>

                        <div className="date-section" style={{ marginTop: '8px', marginBottom: '12px' }}>
                          <span className="date-text">
                            Demandes: {loadingRequests ? (
                              <Loader className="loading-mini-stat" style={{ display: 'inline-block', marginLeft: '4px' }} />
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
                            onClick={() => handleEditClass(classe)}
                            className="action-btn action-primary"
                          >
                            <Edit className="action-icon" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleManageClass(classe)}
                            className="action-btn action-secondary"
                          >
                            <Settings className="action-icon" />
                            <span>Gérer</span>
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
