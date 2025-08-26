import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Grid,
  List,
  Download,
  Share2,
  Archive,
  X,
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import { matiereService } from "../../../../../services/MatiereService";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CourseViewModal from "../../modals/CourseViewModal";
import CourseFormModal from "./CourseFormModal";
import MultiSelectDropdown from "./MultiSelectDropdown";
import CourseCard from "./CourseCard";
import CourseTableRow from "./CourseTableRow";

const COURSE_STATES = {
  BROUILLON: "BROUILLON",
  EN_ATTENTE_VALIDATION: "EN_ATTENTE_VALIDATION",
  PUBLIE: "PUBLIE",
  ARCHIVE: "ARCHIVE",
};

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
  const [selectedMatiereIds, setSelectedMatiereIds] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);

  useEffect(() => {
    loadCourses();
    loadSubjects();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }
      const coursesData = await coursService.getCoursByProfesseur(professorId);
      setCourses(coursesData || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Erreur lors du chargement des cours: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await matiereService.getAllMatieres();
      setSubjects(subjectsData || []);
    } catch (err) {
      console.error("Error loading subjects:", err);
      setError("Erreur lors du chargement des matières: " + err.message);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.matiere?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((course) => course.etat === filterStatus);
    }
    setFilteredCourses(filtered);
  };

  const handleCreateCourse = () => {
    setModalMode("create");
    setSelectedCourse(null);
    setShowCreateModal(true);
  };

  const handleEditCourse = (course) => {
    setModalMode("edit");
    setSelectedCourse(course);
    setShowCreateModal(true);
  };

  const handleViewCourse = (course) => {
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
  };

  const handleViewModalEdit = (course) => {
    handleCloseViewModal();
    handleEditCourse(course);
  };

  const getInitials = (title) => {
    return (
      title
        ?.split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase() || "CO"
    );
  };

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

  if (loading && courses.length === 0) {
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
          <p className="text-slate-600 font-medium">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mes Cours
              </h1>
              <p className="text-slate-600 mt-1">
                Gérez vos cours et suivez vos programmes d'enseignement
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-green-800 font-medium">Succès</p>
                  <p className="text-green-700 text-sm mt-1">{success}</p>
                </div>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <p className="text-red-800 font-medium">Erreur</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Total Cours
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {courses.length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Tous les cours</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Brouillon</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {courses.filter((c) => c.etat === "BROUILLON").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Non publiés</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {
                    courses.filter((c) => c.etat === "EN_ATTENTE_VALIDATION")
                      .length
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">En validation</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Publiés</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {courses.filter((c) => c.etat === "PUBLIE").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Star className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Disponibles</span>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher par titre, description, matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Filter
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="BROUILLON">Brouillon</option>
                  <option value="EN_ATTENTE_VALIDATION">En attente</option>
                  <option value="PUBLIE">Publié</option>
                  <option value="ARCHIVE">Archivé</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              <button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                Nouveau Cours
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onView={handleViewCourse}
                onEdit={handleEditCourse}
                getInitials={getInitials}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Planning
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

        {filteredCourses.length === 0 && !loading && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "Aucun cours trouvé"
                  : "Aucun cours créé"}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche ou de filtrage."
                  : "Commencez par créer votre premier cours pour vos étudiants."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={handleCreateCourse}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto"
                >
                  <Plus size={20} />
                  Créer mon premier cours
                </button>
              )}
            </div>
          </div>
        )}

        {loading && courses.length > 0 && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-indigo-200 rounded-full animate-spin"></div>
                  <div
                    className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin absolute top-0 left-0"
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

      {showViewModal && (
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
