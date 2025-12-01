import React, { useState, useEffect } from "react";
import {
  Search,
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
  Shield,
  Edit3,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { scholchatService } from "../../../../../services/ScholchatService";
import { classService } from "../../../../../services/ClassService";
import ProfessorModal from "../../modals/ProfessorModal";
import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal";
import UserViewModal from "../../modals/UserViewModal";

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

  const handleViewUser = (professor) => {
    setCurrentUser(professor);
    setIsViewModalOpen(true);
  };

  const handleSuccess = () => {
    setIsViewModalOpen(false);
    loadData();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const isAdmin = userRole === "ADMIN";

  if (loading && professors.length === 0) {
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
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
              <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Gestion des Professeurs
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                Gérez efficacement vos professeurs
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 relative">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium text-sm">Erreur</p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Total
                </p>
                <p className="text-lg sm:text-3xl font-bold text-slate-900 mt-1">
                  {professors.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
                <Users className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Professeurs
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
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
                <UserCheck className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">Validés</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
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
                <Clock className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full animate-pulse mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                Validation
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Inactifs
                </p>
                <p className="text-lg sm:text-3xl font-bold text-red-600 mt-1">
                  {
                    professors.filter(
                      (p) => p.etat === "INACTIVE" || p.etat === "REJECTED"
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl">
                <UserX className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
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

        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6">
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4">
              <div className="relative flex-1 min-[480px]:flex-none min-w-0">
                <Filter
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
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
                <ChevronDown
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setModalMode("create");
                      setSelectedProfessor(null);
                      setShowModal(true);
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2"
                  >
                    <Users size={14} className="sm:w-4 sm:h-4" />
                    Ajouter
                  </button>
                )}
                
                <div className="flex bg-slate-100 rounded-lg sm:rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Grille
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            professor.etat
                          )}`}
                        >
                          {getStatusText(professor.etat)}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={12} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex-grow space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs sm:text-sm text-slate-600">
                    <Mail
                      size={10}
                      className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                    />
                    <span className="truncate">{professor.email}</span>
                  </div>

                  {professor.telephone && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <Phone
                        size={10}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
                      />
                      <span className="truncate">{professor.telephone}</span>
                    </div>
                  )}

                  {professor.adresse && (
                    <div className="flex items-center text-xs sm:text-sm text-slate-600">
                      <MapPin
                        size={10}
                        className="sm:w-3.5 sm:h-3.5 mr-2 sm:mr-3 text-slate-400 flex-shrink-0"
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
                            <Edit3
                              size={8}
                              className="sm:w-2.5 sm:h-2.5 mr-1"
                            />
                            Publier
                          </span>
                        )}
                        {professor.peutModerer && (
                          <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield
                              size={8}
                              className="sm:w-2.5 sm:h-2.5 mr-1"
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
                      <Eye size={12} className="sm:w-4 sm:h-4" />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedProfessor(professor);
                            setShowModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <Edit2 size={12} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfessor(professor);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 size={12} className="sm:w-4 sm:h-4" />
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
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Professeur
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Droits
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                              <MapPin
                                size={10}
                                className="mr-1 flex-shrink-0"
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
                            <Mail
                              size={10}
                              className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                            />
                            <span className="truncate">{professor.email}</span>
                          </div>
                          {professor.telephone && (
                            <div className="text-xs text-slate-500 flex items-center">
                              <Phone
                                size={10}
                                className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
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
                          <Hash
                            size={10}
                            className="mr-1 text-slate-400 flex-shrink-0"
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
                          className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            professor.etat
                          )}`}
                        >
                          <div
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-2 ${
                              professor.etat === "ACTIVE"
                                ? "bg-emerald-500"
                                : professor.etat === "AWAITING_VALIDATION" ||
                                  professor.etat === "PENDING"
                                ? "bg-amber-500"
                                : professor.etat === "SUSPECT"
                                ? "bg-orange-500"
                                : professor.etat === "SIGNALE"
                                ? "bg-red-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          {getStatusText(professor.etat)}
                        </span>
                      </td>

                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {professor.peutPublier && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <Edit3
                                size={8}
                                className="sm:w-2.5 sm:h-2.5 mr-1"
                              />
                              Publier
                            </span>
                          )}
                          {professor.peutModerer && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <Shield
                                size={8}
                                className="sm:w-2.5 sm:h-2.5 mr-1"
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
                            <Eye size={12} className="sm:w-4 sm:h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setModalMode("edit");
                                  setSelectedProfessor(professor);
                                  setShowModal(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Modifier"
                              >
                                <Edit2 size={12} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProfessor(professor);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Supprimer"
                              >
                                <Trash2 size={12} className="sm:w-4 sm:h-4" />
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
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
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

      {isViewModalOpen && (
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
