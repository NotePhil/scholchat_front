import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  ChevronDown,
  MoreVertical,
  Calendar,
  Activity,
  User,
  BookOpen,
  School,
  Clock,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { scholchatService } from "../../../../../services/ScholchatService";
import { classService } from "../../../../../services/ClassService";
import { Badge } from "antd";
import { motion } from "framer-motion";
import StudentModal from "../../modals/StudentModal";
import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal";
import UserViewEleve from "../../modals/UserViewEleve";

const StudentsContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const isMobile = useSelector((state) => state.ui.isMobile);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedStudent, setSelectedStudent] = useState(null);
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
    filterStudents();
  }, [students, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        scholchatService.getAllStudents(),
        classService.obtenirToutesLesClasses(),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.niveau?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((student) => student.etat === filterStatus);
    }

    setFilteredStudents(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      INACTIVE: "bg-red-50 text-red-700 border-red-200",
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
      AWAITING_VALIDATION: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusText = (status) => {
    const texts = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      PENDING: "En attente",
      AWAITING_VALIDATION: "En attente",
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        );
      case "INACTIVE":
        return (
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        );
      case "PENDING":
      case "AWAITING_VALIDATION":
        return (
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-amber-100 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
        );
      default:
        return (
          <div className="w-2.5 h-2.5 bg-gray-500 rounded-full ring-2 ring-gray-100 shadow-[0_0_10px_rgba(107,114,128,0.5)]"></div>
        );
    }
  };

  const getLevelText = (level) => {
    const levels = {
      primaire: "Primaire",
      college: "Collège",
      lycee: "Lycée",
      superieur: "Supérieur",
    };
    return levels[level] || level;
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await scholchatService.deleteStudent(selectedStudent.id);
      await loadData();
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
    } catch (err) {
      setError("Erreur lors de la suppression: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (student) => {
    setCurrentUser(student);
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className={`${isDark ? 'text-gray-300' : 'text-slate-600'} font-medium text-sm sm:text-base`}>
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
              <School className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'}`}>
                Gestion des Élèves
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-slate-600'} mt-1 text-xs sm:text-sm`}>
                Gérez efficacement les élèves et leurs associations aux classes
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

        <div className={`${isMobile ? 'hidden' : 'grid'} grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8`}>
          <div 
            onClick={() => setFilterStatus("all")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
              filterStatus === "all" ? "ring-2 ring-blue-500" : ""
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Total
                </p>
                <p className="text-lg sm:text-3xl font-bold text-slate-900 mt-1">
                  {students.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
                <Users className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Élèves enregistrés
              </span>
            </div>
          </div>

          <div 
            onClick={() => setFilterStatus("ACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
              filterStatus === "ACTIVE" ? "ring-2 ring-emerald-500" : ""
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Actifs
                </p>
                <p className="text-lg sm:text-3xl font-bold text-emerald-600 mt-1">
                  {students.filter((s) => s.etat === "ACTIVE").length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl">
                <UserCheck className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                Comptes validés
              </span>
            </div>
          </div>

          <div 
            onClick={() => setFilterStatus("PENDING")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
              filterStatus === "PENDING" ? "ring-2 ring-amber-500" : ""
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  En attente
                </p>
                <p className="text-lg sm:text-3xl font-bold text-amber-600 mt-1">
                  {
                    students.filter(
                      (s) =>
                        s.etat === "PENDING" || s.etat === "AWAITING_VALIDATION"
                    ).length
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
                Validation requise
              </span>
            </div>
          </div>

          <div 
            onClick={() => setFilterStatus("INACTIVE")}
            className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
              filterStatus === "INACTIVE" ? "ring-2 ring-red-500" : ""
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Inactifs
                </p>
                <p className="text-lg sm:text-3xl font-bold text-red-600 mt-1">
                  {students.filter((s) => s.etat === "INACTIVE").length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl">
                <UserX className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-1 sm:mr-2"></div>
              <span className="text-slate-500 text-xs sm:text-sm">
                Comptes désactivés
              </span>
            </div>
          </div>
        </div>

        <div className={`bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl ${isMobile ? 'p-2' : 'p-3 sm:p-6'} shadow-lg mb-6 sm:mb-8`}>
          <div className={`flex flex-col ${isMobile ? 'gap-2' : 'space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6'}`}>
            <div className={`relative flex-1 ${isMobile ? 'max-w-full' : 'max-w-full lg:max-w-md'}`}>
              <Search
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={isMobile ? 14 : 16}
              />
              <input
                type="text"
                placeholder={isMobile ? "Rechercher..." : "Rechercher par nom, email, téléphone, niveau..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-8 pr-2 py-1.5 text-xs' : 'pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base'} bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm`}
              />
            </div>

            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4'}`}>
              <div className={`relative ${isMobile ? 'w-full' : 'flex-1 min-[480px]:flex-none min-w-0'}`}>
                <Filter
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full ${isMobile ? 'pl-8 pr-5 py-1.5 text-xs' : 'pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm'} bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer`}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="ACTIVE">Actifs</option>
                  <option value="INACTIVE">Inactifs</option>
                  <option value="PENDING">En attente</option>
                </select>
                <ChevronDown
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
              </div>

              <div className={`flex items-center ${isMobile ? 'justify-between gap-1' : 'gap-2 sm:gap-3'}`}>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className={`${isMobile ? 'px-2 py-1.5' : 'px-3 sm:px-4 py-2 sm:py-3'} bg-white border border-slate-200 text-slate-600 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <RefreshCw size={isMobile ? 12 : 14} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  {!isMobile && 'Actualiser'}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setModalMode("create");
                      setSelectedStudent(null);
                      setShowModal(true);
                    }}
                    className={`${isMobile ? 'px-2 py-1.5' : 'px-3 sm:px-4 py-2 sm:py-3'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2`}
                  >
                    <Plus size={isMobile ? 12 : 14} className="sm:w-4 sm:h-4" />
                    {!isMobile && 'Ajouter'}
                  </button>
                )}

                <div className="flex bg-slate-100 rounded-lg sm:rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`${isMobile ? 'px-2 py-0.5 text-[10px]' : 'px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm'} rounded-md sm:rounded-lg font-medium transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Grille
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`${isMobile ? 'px-2 py-0.5 text-[10px]' : 'px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm'} rounded-md sm:rounded-lg font-medium transition-all duration-200 ${
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
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'}`}>
            {filteredStudents.map((student, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                key={student.id}
                className={`relative group ${isDark ? 'bg-gray-800/80 border-white/5' : 'bg-white/80 border-white/40'} backdrop-blur-xl border rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full overflow-hidden`}
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="p-5 pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform group-hover:rotate-6 transition-transform">
                          <span className="text-white font-black text-xl tracking-tighter">
                            {getInitials(student.prenom, student.nom)}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusIcon(student.etat)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} text-sm sm:text-base line-clamp-1 mb-1`}>
                          {student.prenom} {student.nom}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge 
                            status={student.etat === 'ACTIVE' ? 'success' : 'default'} 
                            text={getStatusText(student.etat)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(student.etat)}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 flex-grow space-y-3 relative z-10">
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-900/40' : 'bg-slate-50/50'} space-y-3`}>
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3 border border-slate-100">
                        <Mail size={14} className="text-blue-500" />
                      </div>
                      <span className="truncate flex-1">{student.email}</span>
                    </div>

                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3 border border-slate-100">
                        <Phone size={14} className="text-indigo-500" />
                      </div>
                      <span className="truncate flex-1">{student.telephone || "N/A"}</span>
                    </div>

                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3 border border-slate-100">
                        <GraduationCap size={14} className="text-violet-500" />
                      </div>
                      <span className="truncate flex-1 font-bold text-slate-700">{getLevelText(student.niveau)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classes</p>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {student.classes?.length || 0} associées
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {student.classes?.length > 0 ? (
                        <>
                          {student.classes.slice(0, 2).map((cls) => (
                            <span
                              key={cls.id}
                              className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-100 shadow-sm"
                            >
                              {cls.nom}
                            </span>
                          ))}
                          {student.classes.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                              +{student.classes.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 italic">Aucune classe associée</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`px-5 py-3 ${isDark ? 'bg-gray-900/20' : 'bg-slate-50/30'} flex items-center justify-between border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                   <div className="text-[10px] text-slate-400 font-medium">
                      Inscrit le {new Date(student.creationDate).toLocaleDateString()}
                   </div>
                  <div className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleViewUser(student)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-all"
                      title="Détails"
                    >
                      <Eye size={16} />
                    </motion.button>

                    {isAdmin && (
                      <div className="flex space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Élève
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Niveau
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Classes Associées
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-white/50 transition-colors duration-200"
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                              <span className="text-white font-medium text-xs sm:text-sm">
                                {getInitials(student.prenom, student.nom)}
                              </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              {getStatusIcon(student.etat)}
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {student.prenom} {student.nom}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center truncate">
                              <GraduationCap
                                size={10}
                                className="mr-1 flex-shrink-0"
                              />
                              <span className="truncate md:hidden">
                                {getLevelText(student.niveau)}
                              </span>
                              <MapPin
                                size={10}
                                className="mr-1 ml-2 flex-shrink-0 hidden md:inline"
                              />
                              <span className="truncate hidden md:inline">
                                {student.adresse || "Non renseigné"}
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
                            <span className="truncate">{student.email}</span>
                          </div>
                          {student.telephone && (
                            <div className="text-xs text-slate-500 flex items-center">
                              <Phone
                                size={10}
                                className="mr-1 sm:mr-2 text-slate-400 flex-shrink-0"
                              />
                              <span className="truncate">
                                {student.telephone}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {getLevelText(student.niveau)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-slate-900">
                          {new Date(student.creationDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.classes?.length > 0 ? (
                            <>
                              {student.classes.slice(0, 2).map((cls) => (
                                <span
                                  key={cls.id}
                                  className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate"
                                >
                                  {cls.nom}
                                </span>
                              ))}
                              {student.classes.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  +{student.classes.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-400">
                              Aucune classe
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            student.etat
                          )}`}
                        >
                          <div
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1 sm:mr-2 ${
                              student.etat === "ACTIVE"
                                ? "bg-emerald-500"
                                : student.etat === "PENDING" ||
                                  student.etat === "AWAITING_VALIDATION"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          {getStatusText(student.etat)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewUser(student)}
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
                                  setSelectedStudent(student);
                                  setShowModal(true);
                                }}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Modifier"
                              >
                                <Edit2 size={12} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
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

        {filteredStudents.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <School className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun résultat trouvé"
                  : "Aucun élève enregistré"}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage pour voir plus de résultats."
                  : "Il n'y a actuellement aucun élève dans le système."}
              </p>
              {!searchTerm && filterStatus === "all" && isAdmin && (
                <button
                  onClick={() => {
                    setModalMode("create");
                    setSelectedStudent(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto text-sm sm:text-base"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                  Ajouter un élève
                </button>
              )}
            </div>
          </div>
        )}

        {loading && students.length > 0 && (
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
          <StudentModal
            showModal={showModal}
            setShowModal={setShowModal}
            modalMode={modalMode}
            selectedStudent={selectedStudent}
            classes={classes}
            loadData={loadData}
            setError={setError}
            setLoading={setLoading}
            loading={loading}
          />

          <DeleteConfirmationModal
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            selectedUser={selectedStudent}
            handleDelete={handleDelete}
            loading={loading}
            userType="élève"
          />
        </>
      )}

      {isViewModalOpen && (
        <UserViewEleve
          user={currentUser}
          onClose={() => setIsViewModalOpen(false)}
          onSuccess={handleSuccess}
          userType="student"
        />
      )}
    </div>
  );
};

export default StudentsContent;
