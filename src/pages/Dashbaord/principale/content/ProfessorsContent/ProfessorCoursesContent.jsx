import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Grid,
  List,
  X,
  User,
  Plus,
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import { matiereService } from "../../../../../services/MatiereService";
import { minioS3Service } from "../../../../../services/minioS3";
import CourseViewModal from "../../modals/CourseViewModal";
import CourseFormModal from "./CourseFormModal";
import CourseCard from "./CourseCard";
import CourseTableRow from "./CourseTableRow";

const ProfessorCoursesContent = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [subjects, setSubjects] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [userImages, setUserImages] = useState({});

  useEffect(() => {
    loadCourses();
    loadSubjects();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);

  const loadUserImage = async (userId) => {
    if (!userId || userImages[userId]) return;

    try {
      const imageUrl = await minioS3Service.getUserImage(userId);
      setUserImages((prev) => ({
        ...prev,
        [userId]: imageUrl,
      }));
    } catch (err) {
      console.error(`Error loading user image for ${userId}:`, err);
      setUserImages((prev) => ({
        ...prev,
        [userId]: null,
      }));
    }
  };

  // Helper function to validate course object
  const isValidCourse = (course) => {
    return course && typeof course === "object" && course.id && course.titre;
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error(
          "ID du professeur non trouvé. Veuillez vous reconnecter."
        );
      }

      console.log("Chargement des cours pour le professeur:", professorId);

      const coursesData = await coursService.getCoursByProfesseur(professorId);

      console.log("Données brutes reçues:", coursesData);

      // Validate and filter courses more thoroughly
      let validCourses = [];

      if (Array.isArray(coursesData)) {
        validCourses = coursesData.filter(isValidCourse);
      } else if (coursesData && typeof coursesData === "object") {
        // If it's a single course object
        if (isValidCourse(coursesData)) {
          validCourses = [coursesData];
        }
      }

      console.log("Cours valides filtrés:", validCourses);

      setCourses(validCourses);

      // Load user images for course creators
      if (validCourses.length > 0) {
        const userIds = [
          ...new Set(
            validCourses.map((course) => course.redacteurId).filter(Boolean)
          ),
        ];
        userIds.forEach((userId) => loadUserImage(userId));
      }
    } catch (err) {
      console.error("Erreur lors du chargement des cours:", err);
      setError("Erreur lors du chargement des cours: " + err.message);
      setCourses([]); // Ensure courses is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await matiereService.getAllMatieres();

      // Validate subjects data
      const validSubjects = Array.isArray(subjectsData)
        ? subjectsData.filter((subject) => subject && subject.id)
        : [];

      setSubjects(validSubjects);
    } catch (err) {
      console.error("Erreur lors du chargement des matières:", err);
      setError("Erreur lors du chargement des matières: " + err.message);
      setSubjects([]); // Ensure subjects is always an array
    }
  };

  const filterCourses = () => {
    // Start with valid courses only
    let filtered = courses.filter(isValidCourse);

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((course) => {
        const titre = course.titre?.toLowerCase() || "";
        const description = course.description?.toLowerCase() || "";
        const matiereName = course.matiere?.nom?.toLowerCase() || "";

        return (
          titre.includes(searchLower) ||
          description.includes(searchLower) ||
          matiereName.includes(searchLower)
        );
      });
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((course) => course.etat === filterStatus);
    }

    setFilteredCourses(filtered);
  };

  const handleCreateCourse = () => {
    setModalMode("create");
    setSelectedCourse(null);
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const handleEditCourse = (course) => {
    if (!isValidCourse(course)) {
      setError("Cours invalide. Impossible de le modifier.");
      return;
    }

    setModalMode("edit");
    setSelectedCourse(course);
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const handleViewCourse = (course) => {
    if (!isValidCourse(course)) {
      setError("Cours invalide. Impossible de l'afficher.");
      return;
    }

    setViewingCourse(course);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingCourse(null);
  };

  const handleViewModalSuccess = () => {
    loadCourses();
    handleCloseViewModal();
    setSuccess("Action effectuée avec succès !");
  };

  const handleViewModalEdit = (course) => {
    handleCloseViewModal();
    handleEditCourse(course);
  };

  const getInitials = (title) => {
    if (!title || typeof title !== "string") return "CO";
    return title
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getUserAvatar = (course) => {
    if (!isValidCourse(course) || !course.redacteurId) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      );
    }

    const userId = course.redacteurId;
    const userImage = userImages[userId];

    if (userImage) {
      return (
        <img
          src={userImage}
          alt="Professeur"
          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }

    return (
      <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        <User className="w-4 h-4 text-white" />
      </div>
    );
  };

  // Clear messages automatically
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Stats calculations with safety checks
  const validCourses = courses.filter(isValidCourse);
  const brouillonCount = validCourses.filter(
    (c) => c.etat === "BROUILLON"
  ).length;
  const publieCount = validCourses.filter((c) => c.etat === "PUBLIE").length;

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Chargement des cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Mes Cours
                </h1>
                <p className="text-slate-600 mt-1 text-xs sm:text-base">
                  Gérez vos cours et suivez vos programmes d'enseignement
                </p>
              </div>
            </div>

            {/* Create Course Button */}
            <button
              onClick={handleCreateCourse}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nouveau Cours</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-green-800 font-medium text-sm sm:text-base">
                    Succès
                  </p>
                  <p className="text-green-700 text-xs sm:text-sm mt-1">
                    {success}
                  </p>
                </div>
              </div>
              <button
                onClick={clearMessages}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-red-800 font-medium text-sm sm:text-base">
                    Erreur
                  </p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Total Cours
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  {validCourses.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Tous les cours
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Brouillon
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                  {brouillonCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Non publiés
              </span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Publiés
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                  {publieCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-xs sm:text-sm">
                Disponibles
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher par titre, description, matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-1 sm:flex-none">
                <Filter
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer text-sm sm:text-base min-w-0"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="BROUILLON">Brouillon</option>
                  <option value="PUBLIE">Publié</option>
                  <option value="EN_ATTENTE_VALIDATION">En attente</option>
                  <option value="ARCHIVE">Archivé</option>
                </select>
                <ChevronDown
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
              </div>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Vue en grille"
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Vue en tableau"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {filteredCourses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {filteredCourses.length}
                </span>{" "}
                {filteredCourses.length === 1
                  ? "cours trouvé"
                  : "cours trouvés"}
                {searchTerm && (
                  <span>
                    {" "}
                    pour "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span>
                    {" "}
                    avec le statut "
                    <span className="font-medium">
                      {filterStatus === "BROUILLON" && "Brouillon"}
                      {filterStatus === "PUBLIE" && "Publié"}
                      {filterStatus === "EN_ATTENTE_VALIDATION" && "En attente"}
                      {filterStatus === "ARCHIVE" && "Archivé"}
                    </span>
                    "
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Course Content */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="relative">
                <CourseCard
                  course={course}
                  onView={handleViewCourse}
                  onEdit={handleEditCourse}
                  getInitials={getInitials}
                />
                {/* User Avatar Overlay */}
                <div className="absolute top-3 right-3">
                  {getUserAvatar(course)}
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
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                      Matière
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                      Dates
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-slate-100">
                  {filteredCourses.map((course) => (
                    <CourseTableRow
                      key={course.id}
                      course={course}
                      onView={handleViewCourse}
                      onEdit={handleEditCourse}
                      getInitials={getInitials}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCourses.length === 0 && !loading && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun cours trouvé"
                  : "Aucun cours créé"}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage."
                  : "Commencez par créer votre premier cours."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={handleCreateCourse}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Créer mon premier cours</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && courses.length > 0 && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
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

      {/* Modals */}
      {showCreateModal && (
        <CourseFormModal
          modalMode={modalMode}
          selectedCourse={selectedCourse}
          subjects={subjects}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          setSuccess={setSuccess}
          setError={setError}
          loadCourses={loadCourses}
          setLoading={setLoading}
        />
      )}

      {showViewModal && viewingCourse && (
        <CourseViewModal
          classe={viewingCourse}
          onClose={handleCloseViewModal}
          onSuccess={handleViewModalSuccess}
          onEdit={handleViewModalEdit}
          theme="light"
        />
      )}
    </div>
  );
};

export default ProfessorCoursesContent;
