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
} from "lucide-react";
import { classService, EtatClasse } from "../../../services/ClassService";
import ClassModals from "./ClassModals";

const ClassesListContent = ({
  onNavigateToCreate,
  userRole = "professeur",
}) => {
  // State Management
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [paginatedClasses, setPaginatedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [etablissementFilter, setEtablissementFilter] = useState("TOUS");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  // Modal and Action States
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(null);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);

  // Form States
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

  // Navigation States
  const [showEditPage, setShowEditPage] = useState(false);
  const [availableEtablissements, setAvailableEtablissements] = useState([]);

  // Load classes based on user role
  useEffect(() => {
    loadClasses();
    loadEtablissements();
  }, [userRole]);

  // Filter and search effect
  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchTerm, statusFilter, etablissementFilter, classes]);

  // Pagination effect
  useEffect(() => {
    applyPagination();
  }, [filteredClasses, currentPage, itemsPerPage]);

  // Auto-clear messages
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
        default: // professeur
          data = await classService.obtenirToutesLesClasses();
          break;
      }

      // Sort classes by creation date (newest first)
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
      // This would typically come from an etablissement service
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

  const applyFiltersAndSearch = () => {
    let filtered = [...classes];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.nom.toLowerCase().includes(searchLower) ||
          cls.niveau.toLowerCase().includes(searchLower) ||
          (cls.etablissement?.nom || "").toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== "TOUS") {
      filtered = filtered.filter((cls) => cls.etat === statusFilter);
    }

    // Apply etablissement filter
    if (etablissementFilter !== "TOUS") {
      filtered = filtered.filter(
        (cls) => cls.etablissement?.id === etablissementFilter
      );
    }

    setFilteredClasses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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

  // In your ClassesListContent component
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
      // In real implementation, call deactivation service
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

  // Show edit page if editing
  //   if (showEditPage && editingClass) {
  //     return (
  //       <ClassEditPage
  //         classe={editingClass}
  //         onSave={handleEditSave}
  //         onCancel={handleEditCancel}
  //         loading={actionLoading === "edit"}
  //       />
  //     );
  //   }

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
        {/* Header */}
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

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
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

              {/* Filters */}
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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Classes Grid */}
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
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {classe.nom}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
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

                    {/* Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(classe.etat)}
                        <span className="text-sm font-medium text-gray-700">
                          Statut
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                          classe.etat
                        )}`}
                      >
                        {classService.getEtatDisplayName(classe.etat)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {/* View Button */}
                      <button
                        onClick={() => setSelectedClass(classe)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>

                      {/* Edit Button - Available for all roles */}
                      <button
                        onClick={() => handleEdit(classe)}
                        disabled={actionLoading === "edit"}
                        className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === "edit" ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                        Modifier
                      </button>

                      {/* Delete Button - Available for administrateur and professeur */}
                      {(userRole === "administrateur" ||
                        userRole === "professeur") && (
                        <button
                          onClick={() => setShowDeleteModal(classe)}
                          disabled={actionLoading === classe.id}
                          className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === classe.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Supprimer
                        </button>
                      )}

                      {/* Approval Button - Only for etablissement role */}
                      {userRole === "etablissement" &&
                        classe.etat === EtatClasse.EN_ATTENTE_APPROBATION && (
                          <button
                            onClick={() => setShowApprovalModal(classe)}
                            className="bg-yellow-50 text-yellow-600 py-2 px-3 rounded-lg hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4" />
                            Approuver
                          </button>
                        )}

                      {/* Deactivation Button */}
                      {(userRole === "etablissement" ||
                        userRole === "administrateur") &&
                        classe.etat === EtatClasse.ACTIF && (
                          <button
                            onClick={() => setShowDeactivationModal(classe)}
                            className="bg-orange-50 text-orange-600 py-2 px-3 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 text-sm"
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

            {/* Pagination */}
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

        {/* Modals */}
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
        />
      </div>
    </div>
  );
};

export default ClassesListContent;
