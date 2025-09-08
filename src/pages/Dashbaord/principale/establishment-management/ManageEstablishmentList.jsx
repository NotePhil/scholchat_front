import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader,
  Tag,
  Shield,
  Key,
  Plus,
} from "lucide-react";

const ManageEstablishmentList = ({
  establishments = [],
  loading = false,
  refreshing = false,
  onSelectEstablishment,
  onRefresh,
  onDelete,
  onBack,
  onNavigateToCreate, // Add this prop for consistency
}) => {
  // State Management
  const [filteredEstablishments, setFilteredEstablishments] = useState([]);
  const [paginatedEstablishments, setPaginatedEstablishments] = useState([]);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("TOUS");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  // Action States
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Available countries for filter
  const [availableCountries, setAvailableCountries] = useState([]);

  // Filter and search effect
  useEffect(() => {
    applyFiltersAndSearch();
    loadAvailableCountries();
  }, [searchTerm, countryFilter, establishments]);

  // Pagination effect
  useEffect(() => {
    applyPagination();
  }, [filteredEstablishments, currentPage, itemsPerPage]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadAvailableCountries = () => {
    const countries = establishments
      .filter((e) => e.pays)
      .map((e) => e.pays)
      .filter((country, index, self) => self.indexOf(country) === index)
      .sort();

    setAvailableCountries(countries);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...establishments];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (establishment) =>
          establishment.nom?.toLowerCase().includes(searchLower) ||
          establishment.localisation?.toLowerCase().includes(searchLower) ||
          establishment.pays?.toLowerCase().includes(searchLower) ||
          establishment.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply country filter
    if (countryFilter !== "TOUS") {
      filtered = filtered.filter(
        (establishment) => establishment.pays === countryFilter
      );
    }

    setFilteredEstablishments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredEstablishments.slice(startIndex, endIndex);

    setPaginatedEstablishments(paginated);
    setTotalPages(Math.ceil(filteredEstablishments.length / itemsPerPage));
  };

  const handleRefresh = async () => {
    try {
      await onRefresh();
      setSuccessMessage("Liste des établissements actualisée");
    } catch (error) {
      setError("Erreur lors de l'actualisation");
    }
  };

  const handleDelete = async (establishmentId) => {
    try {
      setActionLoading(establishmentId);
      await onDelete(establishmentId);
      setSuccessMessage("Établissement supprimé avec succès");
      setShowDeleteModal(null);
    } catch (error) {
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

  // Statistics
  const totalEstablishments = establishments.length;
  const establishmentsWithEmail = establishments.filter((e) => e.email).length;
  const establishmentsWithTokenGeneral = establishments.filter(
    (e) => e.optionTokenGeneral
  ).length;
  const establishmentsWithCodeUnique = establishments.filter(
    (e) => e.codeUnique
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des établissements...</p>
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
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Gestion des Établissements
                  </h1>
                  <p className="text-blue-100">
                    {filteredEstablishments.length} établissement
                    {filteredEstablishments.length !== 1 ? "s" : ""} trouvé
                    {filteredEstablishments.length !== 1 ? "s" : ""} sur{" "}
                    {establishments.length}
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
                {onNavigateToCreate && (
                  <button
                    onClick={onNavigateToCreate}
                    className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvel Établissement
                  </button>
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
                  placeholder="Rechercher un établissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                {availableCountries.length > 0 && (
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TOUS">Tous les pays</option>
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
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

        {/* Establishments Grid */}
        {paginatedEstablishments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || countryFilter !== "TOUS"
                ? "Aucun résultat trouvé"
                : "Aucun établissement"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || countryFilter !== "TOUS"
                ? "Essayez avec d'autres critères de recherche"
                : "Commencez par créer votre premier établissement"}
            </p>
            {!searchTerm && countryFilter === "TOUS" && onNavigateToCreate && (
              <button
                onClick={onNavigateToCreate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Créer un établissement
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedEstablishments.map((establishment) => (
                <div
                  key={establishment.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {establishment.nom || "N/A"}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          {establishment.localisation && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{establishment.localisation}</span>
                            </div>
                          )}
                          {establishment.pays && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <span>{establishment.pays}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            <span>ID: {establishment.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(establishment.email || establishment.telephone) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          {establishment.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-700">
                                {establishment.email}
                              </span>
                            </div>
                          )}
                          {establishment.telephone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-700">
                                {establishment.telephone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Options/Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {establishment.optionEnvoiMailVersClasse && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Email Classes
                          </span>
                        )}
                        {establishment.optionTokenGeneral && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Token Général
                          </span>
                        )}
                        {establishment.codeUnique && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            Code Unique
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => onSelectEstablishment(establishment.id)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setShowDeleteModal(establishment)}
                        disabled={actionLoading === establishment.id}
                        className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === establishment.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Supprimer
                      </button>
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
                      filteredEstablishments.length
                    )}{" "}
                    sur {filteredEstablishments.length} résultats
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supprimer l'établissement
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cette action est irréversible
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer l'établissement{" "}
                  <strong>{showDeleteModal.nom}</strong> ?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal.id)}
                  disabled={actionLoading === showDeleteModal.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === showDeleteModal.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEstablishmentList;
