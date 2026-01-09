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
  ChevronDown,
  X,
  TrendingUp,
  Activity,
  Star,
  Edit2,
} from "lucide-react";

const ManageEstablishmentList = ({
  establishments = [],
  loading = false,
  refreshing = false,
  onSelectEstablishment,
  onRefresh,
  onDelete,
  onBack,
  onNavigateToCreate,
  onEditEstablishment,
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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
  const establishmentsWithCodeUnique = establishments.filter(
    (e) => e.codeUnique
  ).length;

  if (loading && establishments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Chargement des établissements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg">
              <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Gestion des Établissements
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                Gérez et supervisez tous les établissements du système
              </p>
              <p className="text-slate-500 mt-1 text-xs">
                {filteredEstablishments.length} établissement
                {filteredEstablishments.length !== 1 ? "s" : ""} trouvé
                {filteredEstablishments.length !== 1 ? "s" : ""} sur{" "}
                {establishments.length}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-green-800 font-medium text-sm">Succès</p>
                  <p className="text-green-700 text-xs sm:text-sm mt-1">
                    {successMessage}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-red-800 font-medium text-sm">Erreur</p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Total Établissements
                </p>
                <p className="text-lg sm:text-3xl font-bold text-slate-900 mt-1">
                  {totalEstablishments}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
                <Building2 className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Tous les établissements
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Avec Email
                </p>
                <p className="text-lg sm:text-3xl font-bold text-green-600 mt-1">
                  {establishmentsWithEmail}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl">
                <Mail className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Email configuré
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Code Unique
                </p>
                <p className="text-lg sm:text-3xl font-bold text-purple-600 mt-1">
                  {establishmentsWithCodeUnique}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl">
                <Key className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Code activé
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6">
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher un établissement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4">
              {/* Country Filter */}
              {availableCountries.length > 0 && (
                <div className="relative flex-1 min-[480px]:flex-none min-w-0">
                  <Globe
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="TOUS">Tous les pays</option>
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                </div>
              )}

              {/* Items per page */}
              <div className="relative flex-1 min-[480px]:flex-none min-w-0">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="w-full px-3 sm:px-4 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value={9}>9 par page</option>
                  <option value={12}>12 par page</option>
                  <option value={18}>18 par page</option>
                  <option value={24}>24 par page</option>
                </select>
                <ChevronDown
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={16}
                    className={`sm:w-5 sm:h-5 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>

                {onNavigateToCreate && (
                  <button
                    onClick={onNavigateToCreate}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      Nouvel Établissement
                    </span>
                    <span className="sm:hidden">Nouveau</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Establishments Grid */}
        {paginatedEstablishments.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || countryFilter !== "TOUS"
                  ? "Aucun résultat trouvé"
                  : "Aucun établissement"}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || countryFilter !== "TOUS"
                  ? "Essayez avec d'autres critères de recherche"
                  : "Commencez par créer votre premier établissement"}
              </p>
              {!searchTerm &&
                countryFilter === "TOUS" &&
                onNavigateToCreate && (
                  <button
                    onClick={onNavigateToCreate}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto text-sm sm:text-base"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    Créer mon premier établissement
                  </button>
                )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {paginatedEstablishments.map((establishment) => (
                <div
                  key={establishment.id}
                  className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 truncate">
                        {establishment.nom || "N/A"}
                      </h3>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600">
                        {establishment.localisation && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {establishment.localisation}
                            </span>
                          </div>
                        )}
                        {establishment.pays && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {establishment.pays}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>ID: {establishment.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {(establishment.email || establishment.telephone) && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-50/50 rounded-lg sm:rounded-xl">
                      <div className="space-y-1 sm:space-y-2">
                        {establishment.email && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-700 truncate">
                              {establishment.email}
                            </span>
                          </div>
                        )}
                        {establishment.telephone && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-700">
                              {establishment.telephone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Options/Features */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {establishment.optionEnvoiMailNewClasse && (
                        <span className="px-2 py-0.5 sm:py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Email Classes
                        </span>
                      )}
                      {establishment.optionTokenGeneral && (
                        <span className="px-2 py-0.5 sm:py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
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
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      Voir
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditEstablishment && onEditEstablishment(establishment)}
                      className="bg-green-50 hover:bg-green-100 text-green-600 py-2 px-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteModal(establishment)}
                      disabled={actionLoading === establishment.id}
                      className="bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === establishment.id ? (
                        <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-slate-600 order-2 sm:order-1">
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredEstablishments.length
                    )}{" "}
                    sur {filteredEstablishments.length} résultats
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 sm:p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
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
                            <span
                              key={page}
                              className="text-slate-400 text-xs sm:text-sm px-1"
                            >
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
                          className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            isCurrentPage
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 sm:p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading Overlay */}
        {loading && establishments.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-indigo-200 rounded-full animate-spin"></div>
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-indigo-600 rounded-full animate-spin absolute top-0 left-0"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Supprimer l'établissement
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Cette action est irréversible
                </p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
              <p className="text-xs sm:text-sm text-slate-700">
                Êtes-vous sûr de vouloir supprimer l'établissement{" "}
                <strong className="text-slate-900">
                  {showDeleteModal.nom}
                </strong>{" "}
                ?
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
                disabled={actionLoading === showDeleteModal.id}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 font-medium"
              >
                {actionLoading === showDeleteModal.id ? (
                  <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEstablishmentList;
