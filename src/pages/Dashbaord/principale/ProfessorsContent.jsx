import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Filter,
  X,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Hash,
  GraduationCap,
  ChevronDown,
  MoreVertical,
  Calendar,
  Activity,
} from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import { classService } from "../../../services/ClassService";
import ProfessorModal from "./ProfessorModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import UserViewModalParentStudent from "./modals/UserViewModalParentStudent";

const ProfessorsContent = () => {
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
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProfessors();
  }, [professors, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [professorsData, classesData] = await Promise.all([
        scholchatService.getAllProfessors(),
        classService.obtenirToutesLesClasses(),
      ]);
      setProfessors(professorsData || []);
      setClasses(classesData || []);
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
            .includes(searchTerm.toLowerCase())
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
      INACTIVE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status) => {
    const texts = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      PENDING: "En attente",
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>;
      case "INACTIVE":
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case "PENDING":
        return (
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        );
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
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

  const handleViewUser = (professor) => {
    setCurrentUser(professor);
    setIsViewModalOpen(true);
  };

  const handleApproveUser = async (userId) => {
    try {
      setLoading(true);
      await scholchatService.validateProfessor(userId);
      await loadData();
      setIsViewModalOpen(false);
    } catch (err) {
      setError("Erreur lors de l'approbation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (userId, rejectionData) => {
    try {
      setLoading(true);
      await scholchatService.rejectProfessor(userId, rejectionData);
      await loadData();
      setIsViewModalOpen(false);
    } catch (err) {
      setError("Erreur lors du rejet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  if (loading && professors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Gestion des Professeurs
              </h1>
              <p className="text-slate-600 mt-1">
                Gérez efficacement vos professeurs et leurs affectations
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 relative">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium">Erreur</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {professors.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">
                Professeurs enregistrés
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Actifs</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {professors.filter((p) => p.etat === "ACTIVE").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span className="text-slate-500 text-sm">Comptes validés</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {professors.filter((p) => p.etat === "PENDING").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-slate-500 text-sm">Validation requise</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Inactifs</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {professors.filter((p) => p.etat === "INACTIVE").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-slate-500 text-sm">Comptes désactivés</span>
            </div>
          </div>
        </div>

        {/* Modern Controls */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher par nom, email, matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="ACTIVE">Actifs</option>
                  <option value="INACTIVE">Inactifs</option>
                  <option value="PENDING">En attente</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={() => {
                  setModalMode("create");
                  setSelectedProfessor(null);
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                Nouveau Professeur
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessors.map((professor) => (
              <div
                key={professor.id}
                className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {getInitials(professor.prenom, professor.nom)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(professor.etat)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {professor.prenom} {professor.nom}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                          professor.etat
                        )} mt-1`}
                      >
                        {getStatusText(professor.etat)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative group/actions">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                    {/* You can add a dropdown menu here */}
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail size={14} className="mr-2 text-slate-400" />
                    <span className="truncate">{professor.email}</span>
                  </div>

                  {professor.telephone && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone size={14} className="mr-2 text-slate-400" />
                      <span>{professor.telephone}</span>
                    </div>
                  )}

                  {professor.adresse && (
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin size={14} className="mr-2 text-slate-400" />
                      <span className="truncate">{professor.adresse}</span>
                    </div>
                  )}

                  {professor.matriculeProfesseur && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Hash size={14} className="mr-2 text-slate-400" />
                      <span>{professor.matriculeProfesseur}</span>
                    </div>
                  )}

                  {/* Classes */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Classes modérées
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {professor.moderatedClasses?.length > 0 ? (
                        <>
                          {professor.moderatedClasses.slice(0, 2).map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {cls.nom}
                            </span>
                          ))}
                          {professor.moderatedClasses.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              +{professor.moderatedClasses.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Aucune classe assignée
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleViewUser(professor)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedProfessor(professor);
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProfessor(professor);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Professeur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Classes Modérées
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-sm">
                                {getInitials(professor.prenom, professor.nom)}
                              </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              {getStatusIcon(professor.etat)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {professor.prenom} {professor.nom}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {professor.adresse || "Non renseigné"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-900 flex items-center">
                            <Mail size={12} className="mr-2 text-slate-400" />
                            {professor.email}
                          </div>
                          {professor.telephone && (
                            <div className="text-sm text-slate-500 flex items-center">
                              <Phone
                                size={12}
                                className="mr-2 text-slate-400"
                              />
                              {professor.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900">
                          <Hash size={12} className="mr-1 text-slate-400" />
                          {professor.matriculeProfesseur || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {professor.moderatedClasses?.length > 0 ? (
                            <>
                              {professor.moderatedClasses
                                .slice(0, 2)
                                .map((cls) => (
                                  <span
                                    key={cls.id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {cls.nom}
                                  </span>
                                ))}
                              {professor.moderatedClasses.length > 2 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  +{professor.moderatedClasses.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Aucune classe
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            professor.etat
                          )}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              professor.etat === "ACTIVE"
                                ? "bg-emerald-500"
                                : professor.etat === "PENDING"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          {getStatusText(professor.etat)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewUser(professor)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Voir les détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setModalMode("edit");
                              setSelectedProfessor(professor);
                              setShowModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProfessor(professor);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProfessors.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <Users className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun résultat trouvé"
                  : "Aucun professeur enregistré"}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage pour voir plus de résultats."
                  : "Commencez par ajouter votre premier professeur au système."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={() => {
                    setModalMode("create");
                    setSelectedProfessor(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  Ajouter un professeur
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && professors.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div
                    className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
                    style={{
                      clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                    }}
                  ></div>
                </div>
                <p className="text-slate-700 font-medium">
                  Traitement en cours...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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

      {isViewModalOpen && (
        <UserViewModalParentStudent
          user={currentUser}
          onClose={() => setIsViewModalOpen(false)}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
        />
      )}
    </div>
  );
};

export default ProfessorsContent;
