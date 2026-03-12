import React, { useState, useEffect } from "react";
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
  Download,
  RefreshCw,
  Settings,
  UserCheck,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { classService, EtatClasse } from "../../../../../services/ClassService";
import ClassModals from "../../modals/ClassModals";
import PublicationRightsService from "../../../../../services/PublicationRightsService";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

const ClassesListContent = ({
  onNavigateToCreate,
  userRole = "professeur",
  onSelectClass,
}) => {
  const { t } = useTranslation();
  const isMobile = useSelector((state) => state.ui.isMobile);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [paginatedClasses, setPaginatedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [etablissementFilter, setEtablissementFilter] = useState("TOUS");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(null);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showPublicationRightsModal, setShowPublicationRightsModal] =
    useState(null);

  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationComment, setDeactivationComment] = useState("");
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
  });

  const [publicationRights, setPublicationRights] = useState({});
  const [loadingRights, setLoadingRights] = useState({});

  const [accessRequestCounts, setAccessRequestCounts] = useState({});

  const [showEditPage, setShowEditPage] = useState(false);
  const [availableEtablissements, setAvailableEtablissements] = useState([]);

  const currentUserId =
    localStorage.getItem("userId") || sessionStorage.getItem("userId");

  useEffect(() => {
    loadClasses();
    loadEtablissements();
  }, [userRole]);

  useEffect(() => {
    if (classes.length > 0) {
      loadAccessRequestCounts();
    }
  }, [classes]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchTerm, statusFilter, etablissementFilter, classes]);

  useEffect(() => {
    applyPagination();
  }, [filteredClasses, currentPage, itemsPerPage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      let data = [];

      switch (userRole) {
        case "administrateur":
          data = await classService.obtenirToutesLesClasses();
          break;
        case "etablissement":
          data = await classService.obtenirClassesEnAttente();
          break;
        default:
          if (currentUserId) {
            try {
              const rightsResponse =
                await PublicationRightsService.getClassesWithRightsForUser(
                  currentUserId
                );
              if (rightsResponse.success && rightsResponse.data) {
                const classPromises = rightsResponse.data.map(
                  async (classId) => {
                    try {
                      return await classService.obtenirClasse(classId);
                    } catch (error) {
                      console.error(`Error loading class ${classId}:`, error);
                      return null;
                    }
                  }
                );

                const classesData = await Promise.all(classPromises);
                data = classesData.filter((cls) => cls !== null);
              } else {
                data = [];
              }
            } catch (error) {
              console.warn(
                "Failed to load classes with publication rights:",
                error
              );
              data = [];
            }
          } else {
            data = [];
          }
          break;
      }

      data.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

      setClasses(data);
      setError("");
    } catch (error) {
      console.error("Error loading classes:", error);
      setError("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  };

  const loadEtablissements = async () => {
    try {
      const etablissements = classes
        .filter((c) => c.etablissement)
        .map((c) => c.etablissement)
        .filter(
          (e, index, self) =>
            self.findIndex((item) => item.id === e.id) === index
        );

      setAvailableEtablissements(etablissements);
    } catch (error) {
      console.error("Error loading etablissements:", error);
    }
  };

  const loadPublicationRights = async (classId) => {
    if (!classId) return;

    try {
      setLoadingRights((prev) => ({ ...prev, [classId]: true }));
      const response =
        await PublicationRightsService.getUsersWithRightsForClass(classId);

      if (response.success) {
        setPublicationRights((prev) => ({
          ...prev,
          [classId]: response.data || [],
        }));
      }
    } catch (error) {
      console.error(
        `Error loading publication rights for class ${classId}:`,
        error
      );
    } finally {
      setLoadingRights((prev) => ({ ...prev, [classId]: false }));
    }
  };

  const loadAccessRequestCounts = async () => {
    try {
      const counts = {};
      await Promise.all(
        classes.map(async (classe) => {
          try {
            const response = await fetch(
              `${process.env.REACT_APP_API_BASE_URL}/acceder/demandes/classe/${classe.id}`
            );
            if (response.ok) {
              const requests = await response.json();
              const pendingCount = requests.filter(
                (req) => req.etat === "EN_ATTENTE"
              ).length;
              counts[classe.id] = pendingCount;
            }
          } catch (error) {
            console.error(
              `Error loading access requests for class ${classe.id}:`,
              error
            );
            counts[classe.id] = 0;
          }
        })
      );
      setAccessRequestCounts(counts);
    } catch (error) {
      console.error("Error loading access request counts:", error);
    }
  };

  const hasPublicationRights = (classId) => {
    if (!currentUserId || !publicationRights[classId]) return false;

    return publicationRights[classId].some((user) => user.id === currentUserId);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...classes];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.nom.toLowerCase().includes(searchLower) ||
          cls.niveau.toLowerCase().includes(searchLower) ||
          (cls.etablissement?.nom || "").toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "TOUS") {
      filtered = filtered.filter((cls) => cls.etat === statusFilter);
    }

    if (etablissementFilter !== "TOUS") {
      filtered = filtered.filter(
        (cls) => cls.etablissement?.id === etablissementFilter
      );
    }

    setFilteredClasses(filtered);
    setCurrentPage(1);
  };

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredClasses.slice(startIndex, endIndex);

    setPaginatedClasses(paginated);
    setTotalPages(Math.ceil(filteredClasses.length / itemsPerPage));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
    setSuccessMessage("Liste des classes actualisée");
  };

  const handleEdit = (classe) => {
    setEditingClass(classe);
  };

  const handleEditSave = async (updatedClass) => {
    try {
      setActionLoading("edit");
      await classService.modifierClasse(updatedClass.id, updatedClass);
      await loadClasses();
      setEditingClass(null);
      setSuccessMessage("Classe modifiée avec succès");
    } catch (error) {
      console.error("Error updating class:", error);
      setError("Erreur lors de la modification de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditPage(false);
    setEditingClass(null);
  };

  const handleApprove = async (classId) => {
    try {
      setActionLoading(classId);
      await classService.approuverClasse(classId);
      await loadClasses();
      setShowApprovalModal(null);
      setSuccessMessage("Classe approuvée avec succès");
      setError("");
    } catch (error) {
      console.error("Error approving class:", error);
      setError("Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (classId, motif) => {
    try {
      setActionLoading(classId);
      await classService.rejeterClasse(classId, motif);
      await loadClasses();
      setShowApprovalModal(null);
      setSuccessMessage("Classe rejetée");
      setError("");
    } catch (error) {
      console.error("Error rejecting class:", error);
      setError("Erreur lors du rejet");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivation = async (classId, motif, commentaire) => {
    try {
      setActionLoading(classId);
      console.log("Deactivating class:", { classId, motif, commentaire });
      await loadClasses();
      setShowDeactivationModal(null);
      setDeactivationReason("");
      setDeactivationComment("");
      setSuccessMessage("Classe désactivée");
      setError("");
    } catch (error) {
      console.error("Error deactivating class:", error);
      setError("Erreur lors de la désactivation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccessRequest = async () => {
    try {
      setActionLoading("access-request");
      console.log("Processing access request with token:", accessToken);
      setShowAccessRequestModal(false);
      setAccessToken("");
      setSuccessMessage("Demande d'accès envoyée");
      setError("");
    } catch (error) {
      console.error("Error processing access request:", error);
      setError("Token invalide ou erreur lors de la demande");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayment = async (classData) => {
    try {
      setActionLoading("payment");
      console.log("Processing payment:", paymentData);
      console.log("Creating class:", classData);

      setTimeout(() => {
        setShowPaymentModal(null);
        setPaymentData({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardHolder: "",
        });
        loadClasses();
        setSuccessMessage("Paiement effectué et classe créée");
        setActionLoading(null);
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Erreur lors du paiement");
      setActionLoading(null);
    }
  };

  const handleDelete = async (classId) => {
    try {
      setActionLoading(classId);
      await classService.supprimerClasse(classId);
      await loadClasses();
      await loadAccessRequestCounts();
      setShowDeleteModal(null);
      setSuccessMessage("Classe supprimée avec succès");
      setError("");
    } catch (error) {
      console.error("Error deleting class:", error);
      setError("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleManagePublicationRights = async (classe) => {
    setShowPublicationRightsModal(classe);
    await loadPublicationRights(classe.id);
  };

  const getStatusColor = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return "bg-green-100 text-green-800";
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "bg-yellow-100 text-yellow-800";
      case EtatClasse.INACTIF:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return <CheckCircle className="w-4 h-4" />;
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return <Clock className="w-4 h-4" />;
      case EtatClasse.INACTIF:
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleManageClass = (classe) => {
    if (onSelectClass) {
      onSelectClass(classe.id);
    } else {
      console.log("Managing class:", classe.id);
    }
  };

  const shouldShowManageButton = (classe) => {
    if (userRole === "administrateur") {
      return true;
    }

    if (userRole === "professeur") {
      return (
        classe.etat === EtatClasse.ACTIF && hasPublicationRights(classe.id)
      );
    }

    if (userRole === "etablissement") {
      return classe.etat === EtatClasse.ACTIF;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'py-4 px-2' : 'py-4 px-4'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 ${isMobile ? 'px-4 py-3' : 'px-8 py-6'}`}>
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-white/20 rounded-full flex items-center justify-center`}>
                  <GraduationCap className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                </div>
                <div>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-white`}>
                    {t('classes.title', 'Gestion des Classes')}
                  </h1>
                  <p className={`text-blue-100 ${isMobile ? 'text-xs' : ''}`}>
                    {filteredClasses.length} {t('classes.classCount', 'classe')}
                    {filteredClasses.length !== 1 ? "s" : ""} {t('classes.found', 'trouvée')}
                    {filteredClasses.length !== 1 ? "s" : ""} {t('common.on', 'sur')}{" "}
                    {classes.length}
                  </p>
                </div>
              </div>
              <div className={`flex ${isMobile ? 'gap-1.5 flex-wrap' : 'gap-3'}`}>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`bg-white/20 text-white ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2'} rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-1.5`}
                >
                  <RefreshCw
                    className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${refreshing ? "animate-spin" : ""}`}
                  />
                  {!isMobile && t('common.actions.refresh', 'Actualiser')}
                </button>
                {userRole === "professeur" && (
                  <>
                    <button
                      onClick={() => setShowAccessRequestModal(true)}
                      className={`bg-white/20 text-white ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-6 py-2'} rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-1.5`}
                    >
                      <Key className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                      {!isMobile && t('classes.accessToken', 'Accès Token')}
                    </button>
                    <button
                      onClick={onNavigateToCreate}
                      className={`bg-white text-blue-600 ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-6 py-2'} rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-1.5`}
                    >
                      <Plus className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                      {isMobile ? t('classes.newClass', 'Nouvelle Classe').split(' ')[0] : t('classes.newClass', 'Nouvelle Classe')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={`${isMobile ? 'p-3' : 'p-6'} border-b border-gray-200`}>
            <div className={`flex flex-col ${isMobile ? 'gap-2' : 'lg:flex-row gap-4'}`}>
              <div className={`relative flex-1 ${isMobile ? 'max-w-full' : 'max-w-md'}`}>
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
                <input
                  type="text"
                  placeholder={t('classes.searchPlaceholder', 'Rechercher une classe...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full ${isMobile ? 'pl-9 pr-3 py-2 text-xs' : 'pl-12 pr-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-3'}`}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${isMobile ? 'w-full px-3 py-1.5 text-xs' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="TOUS">{t('classes.filters.allStatuses', 'Tous les statuts')}</option>
                  <option value={EtatClasse.ACTIF}>{t('classes.status.active', 'Actif')}</option>
                  <option value={EtatClasse.EN_ATTENTE_APPROBATION}>
                    {t('classes.status.pending', 'En attente')}
                  </option>
                  <option value={EtatClasse.INACTIF}>{t('classes.status.inactive', 'Inactif')}</option>
                </select>

                {availableEtablissements.length > 0 && (
                  <select
                    value={etablissementFilter}
                    onChange={(e) => setEtablissementFilter(e.target.value)}
                    className={`${isMobile ? 'w-full px-3 py-1.5 text-xs' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="TOUS">{t('classes.filters.allSchools', 'Tous les établissements')}</option>
                    {availableEtablissements.map((etab) => (
                      <option key={etab.id} value={etab.id}>
                        {etab.nom}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className={`${isMobile ? 'w-full px-3 py-1.5 text-xs' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value={9}>{t('common.perPage', '{{count}} par page', { count: 9 })}</option>
                  <option value={12}>{t('common.perPage', '{{count}} par page', { count: 12 })}</option>
                  <option value={18}>{t('common.perPage', '{{count}} par page', { count: 18 })}</option>
                  <option value={24}>{t('common.perPage', '{{count}} par page', { count: 24 })}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {paginatedClasses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ||
              statusFilter !== "TOUS" ||
              etablissementFilter !== "TOUS"
                ? t('classes.empty.noResults', "Aucun résultat trouvé")
                : t('classes.empty.noClasses', "Aucune classe")}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ||
              statusFilter !== "TOUS" ||
              etablissementFilter !== "TOUS"
                ? t('classes.empty.noResultsDesc', "Essayez avec d'autres critères de recherche")
                : t('classes.empty.noClassesDesc', "Commencez par créer votre première classe")}
            </p>
            {!searchTerm &&
              statusFilter === "TOUS" &&
              etablissementFilter === "TOUS" &&
              userRole === "professeur" && (
                <button
                  onClick={onNavigateToCreate}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  {t('classes.empty.createFirst', "Créer une classe")}
                </button>
              )}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'} mb-6`}
              >
                {paginatedClasses.map((classe, index) => (
                  <motion.div
                    key={classe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 group relative"
                  >
                    {/* Notification Badge - Keep as is */}
                    {accessRequestCounts[classe.id] > 0 && (
                      <div className="absolute top-3 right-3 z-20">
                        <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-md border-2 border-white animate-pulse">
                          <span className="text-white font-bold text-xs">
                            {accessRequestCounts[classe.id]}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header - More Compact */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4">
                          <h3 className="text-base font-bold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {classe.nom}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span className="font-medium">{classe.niveau}</span>
                          </div>
                        </div>
                        
                        {/* Status Badge - Smaller */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            classe.etat
                          )}`}
                        >
                          <span className="w-3 h-3">{getStatusIcon(classe.etat)}</span>
                          <span className="hidden sm:inline">{classService.getEtatDisplayName(classe.etat)}</span>
                        </span>
                      </div>

                      {/* Info Section - Inline & Compact */}
                      <div className="space-y-2 mb-3">
                        {/* Établissement */}
                        {classe.etablissement && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                              <School className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="truncate font-medium">{classe.etablissement.nom}</span>
                          </div>
                        )}

                        {/* Students & Date - Inline */}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-green-50 rounded flex items-center justify-center flex-shrink-0">
                              <Users className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {classe.nombreEtudiants ||
                                classe.eleves?.length ||
                                classe.participants?.length ||
                                0}
                            </span>
                            <span className="text-gray-500">{t('classes.card.students', 'élèves')}</span>
                          </div>

                          {classe.dateCreation && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-3 h-3 text-purple-600" />
                              </div>
                              <span className="text-gray-600">
                                {new Date(classe.dateCreation).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Publication Rights - Compact */}
                        {userRole === "professeur" && (
                          <div
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium ${
                              hasPublicationRights(classe.id)
                                ? 'bg-green-50 text-green-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {hasPublicationRights(classe.id) ? (
                              <>
                                <UserCheck className="w-3 h-3 flex-shrink-0" />
                                <span>{t('classes.card.rightsGranted', 'Droits accordés')}</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 flex-shrink-0" />
                                <span>{t('classes.card.rights.none', 'Aucun droit')}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Pending Notice - Compact */}
                        {classe.etat === EtatClasse.EN_ATTENTE_APPROBATION &&
                          userRole === "professeur" && (
                            <div className="flex items-start gap-1.5 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{t('classes.card.pendingBadge', "En attente d'approbation")}</span>
                            </div>
                          )}
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
                        {/* Primary Row */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {shouldShowManageButton(classe) && (
                            <button
                              onClick={() => handleManageClass(classe)}
                              className="relative flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-colors shadow-sm hover:shadow-md"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>{t('classes.actions.manage', 'Gérer')}</span>
                              {accessRequestCounts[classe.id] > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse border-2 border-white shadow-sm">
                                  {accessRequestCounts[classe.id]}
                                </span>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedClass(classe)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                              shouldShowManageButton(classe) 
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" 
                                : "bg-blue-600 hover:bg-blue-700 text-white col-span-2 shadow-sm"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('classes.card.seeDetails', 'Détails')}</span>
                          </button>

                          {!shouldShowManageButton(classe) && (
                            <button
                              onClick={() => handleEdit(classe)}
                              disabled={
                                actionLoading === "edit" ||
                                (userRole === "professeur" &&
                                  !hasPublicationRights(classe.id))
                              }
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
                            >
                              {actionLoading === "edit" ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Edit className="w-3.5 h-3.5" />
                              )}
                              <span>{t('classes.actions.edit', 'Modifier')}</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary Row - More Compact */}
                        <div className="flex gap-1.5">
                          {userRole === "administrateur" &&
                            classe.etat === EtatClasse.ACTIF && (
                              <button
                                onClick={() => handleManagePublicationRights(classe)}
                                disabled={loadingRights[classe.id]}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {loadingRights[classe.id] ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">{t('classes.actions.rights', 'Droits')}</span>
                              </button>
                            )}

                          {(userRole === "administrateur" ||
                            (userRole === "professeur" &&
                              hasPublicationRights(classe.id))) && (
                            <button
                              onClick={() => setShowDeleteModal(classe)}
                              disabled={actionLoading === classe.id}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading === classe.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          )}

                          {userRole === "etablissement" &&
                            classe.etat === EtatClasse.EN_ATTENTE_APPROBATION && (
                              <button
                                onClick={() => setShowApprovalModal(classe)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>{t('classes.actions.approve', 'Approuver')}</span>
                              </button>
                            )}

                          {(userRole === "etablissement" ||
                            userRole === "administrateur") &&
                            classe.etat === EtatClasse.ACTIF && (
                              <button
                                onClick={() => setShowDeactivationModal(classe)}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-xs font-medium transition-colors"
                              >
                                <PowerOff className="w-3 h-3" />
                                <span className="hidden sm:inline">{t('classes.actions.deactivate', 'Désactiver')}</span>
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {t('subjects.pagination.showing', { 
                      start: (currentPage - 1) * itemsPerPage + 1,
                      end: Math.min(currentPage * itemsPerPage, filteredClasses.length),
                      total: filteredClasses.length
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === currentPage;
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
                            <span key={page} className="text-gray-400">
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCurrentPage
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <ClassModals
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          editingClass={editingClass}
          setEditingClass={setEditingClass}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          showApprovalModal={showApprovalModal}
          setShowApprovalModal={setShowApprovalModal}
          showDeactivationModal={showDeactivationModal}
          setShowDeactivationModal={setShowDeactivationModal}
          showAccessRequestModal={showAccessRequestModal}
          setShowAccessRequestModal={setShowAccessRequestModal}
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          showPublicationRightsModal={showPublicationRightsModal}
          setShowPublicationRightsModal={setShowPublicationRightsModal}
          actionLooading={actionLoading}
          setActionLoading={setActionLoading}
          error={error}
          setError={setError}
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          deactivationReason={deactivationReason}
          setDeactivationReason={setDeactivationReason}
          deactivationComment={deactivationComment}
          setDeactivationComment={setDeactivationComment}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleDeactivation={handleDeactivation}
          handleAccessRequest={handleAccessRequest}
          handlePayment={handlePayment}
          handleDelete={handleDelete}
          loadClasses={loadClasses}
          getStatusColor={getStatusColor}
          publicationRights={publicationRights}
          loadingRights={loadingRights}
          loadPublicationRights={loadPublicationRights}
        />
      </div>
    </div>
  );
};

export default ClassesListContent;
