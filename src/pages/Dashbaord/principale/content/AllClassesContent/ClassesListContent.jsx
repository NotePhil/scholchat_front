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
import { classService, EtatClasse } from "../../../../../services/ClassService";
import ClassModals from "../../modals/ClassModals";
import PublicationRightsService from "../../../../../services/PublicationRightsService";

const ClassesListContent = ({
  onNavigateToCreate,
  userRole = "professeur",
  onSelectClass,
}) => {
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
              `http://localhost:8486/scholchat/acceder/demandes/classe/${classe.id}`
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Gestion des Classes
                  </h1>
                  <p className="text-blue-100">
                    {filteredClasses.length} classe
                    {filteredClasses.length !== 1 ? "s" : ""} trouvée
                    {filteredClasses.length !== 1 ? "s" : ""} sur{" "}
                    {classes.length}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Actualiser
                </button>
                {userRole === "professeur" && (
                  <>
                    <button
                      onClick={() => setShowAccessRequestModal(true)}
                      className="bg-white/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <Key className="w-5 h-5" />
                      Accès Token
                    </button>
                    <button
                      onClick={onNavigateToCreate}
                      className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Nouvelle Classe
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value={EtatClasse.ACTIF}>Actif</option>
                  <option value={EtatClasse.EN_ATTENTE_APPROBATION}>
                    En attente
                  </option>
                  <option value={EtatClasse.INACTIF}>Inactif</option>
                </select>

                {availableEtablissements.length > 0 && (
                  <select
                    value={etablissementFilter}
                    onChange={(e) => setEtablissementFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TOUS">Tous les établissements</option>
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
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={9}>9 par page</option>
                  <option value={12}>12 par page</option>
                  <option value={18}>18 par page</option>
                  <option value={24}>24 par page</option>
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
                ? "Aucun résultat trouvé"
                : "Aucune classe"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ||
              statusFilter !== "TOUS" ||
              etablissementFilter !== "TOUS"
                ? "Essayez avec d'autres critères de recherche"
                : "Commencez par créer votre première classe"}
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
                  Créer une classe
                </button>
              )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedClasses.map((classe) => (
                <div
                  key={classe.id}
                  className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group relative"
                >
                  {accessRequestCounts[classe.id] > 0 && (
                    <div className="absolute top-3 right-3 z-20 animate-bounce">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl border-4 border-white">
                          <span className="text-white font-bold text-base">
                            {accessRequestCounts[classe.id]}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all duration-300 pointer-events-none" />
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            {classe.nom}
                          </h3>
                        </div>
                        <div className="space-y-2.5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>{classe.niveau}</span>
                          </div>
                          {classe.etablissement && (
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4" />
                              <span>{classe.etablissement.nom}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{classe.eleves?.length || 0} élèves</span>
                          </div>
                          {classe.dateCreation && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(
                                  classe.dateCreation
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        {getStatusIcon(classe.etat)}
                        <span className="text-sm font-semibold text-slate-700">
                          Statut
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full shadow-sm ${getStatusColor(
                          classe.etat
                        )}`}
                      >
                        {classService.getEtatDisplayName(classe.etat)}
                      </span>

                      {userRole === "professeur" && (
                        <div className="mt-2 text-xs flex items-center gap-1">
                          {hasPublicationRights(classe.id) ? (
                            <>
                              <UserCheck className="w-3 h-3 text-green-600" />
                              <span className="text-green-600">
                                Vous avez des droits de publication
                              </span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-amber-600" />
                              <span className="text-amber-600">
                                Aucun droit de publication
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {classe.etat === EtatClasse.EN_ATTENTE_APPROBATION &&
                        userRole === "professeur" && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            En attente d'approbation. Le bouton "Gérer" sera
                            disponible après approbation.
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap relative z-10">
                      <button
                        onClick={() => setSelectedClass(classe)}
                        className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 py-2.5 px-3 rounded-xl hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>

                      {shouldShowManageButton(classe) && (
                        <button
                          onClick={() => handleManageClass(classe)}
                          className="flex-1 bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 py-2.5 px-3 rounded-xl hover:from-indigo-100 hover:to-indigo-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md relative"
                        >
                          <Settings className="w-4 h-4" />
                          Gérer
                          {accessRequestCounts[classe.id] > 0 && (
                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse shadow-lg">
                              {accessRequestCounts[classe.id]}
                            </span>
                          )}
                        </button>
                      )}

                      {userRole === "administrateur" &&
                        classe.etat === EtatClasse.ACTIF && (
                          <button
                            onClick={() =>
                              handleManagePublicationRights(classe)
                            }
                            disabled={loadingRights[classe.id]}
                            className="flex-1 bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 py-2.5 px-3 rounded-xl hover:from-purple-100 hover:to-purple-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingRights[classe.id] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            Droits
                          </button>
                        )}

                      <button
                        onClick={() => handleEdit(classe)}
                        disabled={
                          actionLoading === "edit" ||
                          (userRole === "professeur" &&
                            !hasPublicationRights(classe.id))
                        }
                        className="flex-1 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 py-2.5 px-3 rounded-xl hover:from-green-100 hover:to-green-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === "edit" ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                        Modifier
                      </button>

                      {(userRole === "administrateur" ||
                        (userRole === "professeur" &&
                          hasPublicationRights(classe.id))) && (
                        <button
                          onClick={() => setShowDeleteModal(classe)}
                          disabled={actionLoading === classe.id}
                          className="bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 py-2.5 px-3 rounded-xl hover:from-red-100 hover:to-red-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === classe.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Supprimer
                        </button>
                      )}

                      {userRole === "etablissement" &&
                        classe.etat === EtatClasse.EN_ATTENTE_APPROBATION && (
                          <button
                            onClick={() => setShowApprovalModal(classe)}
                            className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 text-yellow-700 py-2.5 px-3 rounded-xl hover:from-yellow-100 hover:to-yellow-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            <Check className="w-4 h-4" />
                            Approuver
                          </button>
                        )}

                      {(userRole === "etablissement" ||
                        userRole === "administrateur") &&
                        classe.etat === EtatClasse.ACTIF && (
                          <button
                            onClick={() => setShowDeactivationModal(classe)}
                            className="bg-gradient-to-r from-orange-50 to-orange-100/50 text-orange-700 py-2.5 px-3 rounded-xl hover:from-orange-100 hover:to-orange-200/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            <PowerOff className="w-4 h-4" />
                            Désactiver
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredClasses.length
                    )}{" "}
                    sur {filteredClasses.length} résultats
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
