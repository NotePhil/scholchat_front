import React, { useState, useEffect } from "react";
import { coursService } from "../../../../../services/CoursService";
import { matiereService } from "../../../../../services/MatiereService";
import { classService } from "../../../../../services/ClassService";
import { coursProgrammerService } from "../../../../../services/coursProgrammerService";
import CreateCourseComponent from "./CreateCourseComponent";
import CourseContentView from "./CourseContentView";
import CourseCard from "./CourseCard";
import CourseTableRow from "./CourseTableRow";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBookOpen,
  faCalendarDays,
  faChevronDown,
  faCircleCheck,
  faCircleExclamation,
  faFilter,
  faList,
  faMagnifyingGlass,
  faPlus,
  faTableCells,
  faXmark,
  faArrowTrendUp,
  faFileLines,
  faHeartPulse,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../../utils/faIconAdapter";
const Activity = asIconComponent(faHeartPulse);
const BookOpen = asIconComponent(faBookOpen);
const CheckCircle = asIconComponent(faCircleCheck);
const FileText = asIconComponent(faFileLines);
const Star = asIconComponent(faStar);
const TrendingUp = asIconComponent(faArrowTrendUp);
const ProfessorCoursesContent = ({ setActiveTab }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClassId, setFilterClassId] = useState(null);
  const [filterClassName, setFilterClassName] = useState("");
  const [professorClasses, setProfessorClasses] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [subjects, setSubjects] = useState([]);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [showCourseContent, setShowCourseContent] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  useEffect(() => {
    const savedClassId = localStorage.getItem("selectedClassId");
    if (savedClassId) {
      localStorage.removeItem("selectedClassId");
      setFilterClassId(savedClassId);
      loadCourses(savedClassId);
    } else {
      loadCourses(null);
    }
    loadSubjects();
    loadProfessorClasses(savedClassId || null);
  }, []);
  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);
  const loadProfessorClasses = async (preselectedClassId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const classes = await classService.obtenirClassesUtilisateur(userId);
      setProfessorClasses(classes || []);
      if (preselectedClassId && classes) {
        const cls = classes.find(
          (c) => String(c.id) === String(preselectedClassId),
        );
        if (cls)
          setFilterClassName(
            cls.nom || cls.name || cls.titre || `Classe ${cls.id}`,
          );
      }
    } catch {
      /* non-blocking */
    }
  };
  const loadCourses = async (classeId) => {
    try {
      setLoading(true);
      setError("");
      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }
      const allCourses = await coursService.getCoursByProfesseur(professorId);
      if (classeId) {
        // Load scheduled courses for the class to find which course IDs are in it
        try {
          const scheduled =
            await coursProgrammerService.obtenirProgrammationParClasse(
              classeId,
            );
          const courseIdsInClass = new Set(
            (scheduled || [])
              .map((sc) => sc.coursId || sc.cours?.id)
              .filter(Boolean)
              .map(String),
          );
          const filtered = (allCourses || []).filter((c) =>
            courseIdsInClass.has(String(c.id)),
          );
          setCourses(filtered);
        } catch {
          setCourses(allCourses || []);
        }
      } else {
        setCourses(allCourses || []);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Erreur lors du chargement des cours: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleClassFilterChange = (classId) => {
    const cls = professorClasses.find((c) => String(c.id) === String(classId));
    setFilterClassId(classId || null);
    setFilterClassName(
      cls ? cls.nom || cls.name || cls.titre || `Classe ${cls.id}` : "",
    );
    loadCourses(classId || null);
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
          course.matiere?.nom?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((course) => course.etat === filterStatus);
    }
    setFilteredCourses(filtered);
  };
  const handleCreateCourse = () => {
    if (setActiveTab) setActiveTab("create-course");
  };
  const handleBackFromCreate = () => {
    // no-op: kept for compatibility if called elsewhere
  };
  const handleBackFromCourseContent = () => {
    setShowCourseContent(false);
    setViewingCourse(null);
  };
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowEditForm(true);
  };
  const handleBackFromEdit = () => {
    setShowEditForm(false);
    setEditingCourse(null);
  };
  const handleViewCourse = (course) => {
    setViewingCourse(course);
    setShowCourseContent(true);
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
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
              style={{
                clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
              }}
            ></div>
          </div>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Chargement des cours...
          </p>
        </div>
      </div>
    );
  }
  if (showEditForm && editingCourse) {
    return (
      <CreateCourseComponent
        onBack={handleBackFromEdit}
        subjects={subjects}
        setSuccess={setSuccess}
        setError={setError}
        loadCourses={loadCourses}
        setLoading={setLoading}
        editMode={true}
        courseToEdit={editingCourse}
      />
    );
  }
  if (showCourseContent && viewingCourse) {
    return (
      <CourseContentView
        course={viewingCourse}
        onBack={handleBackFromCourseContent}
      />
    );
  }
  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md flex-shrink-0">
              <FontAwesomeIcon
                icon={faBookOpen}
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
                Mes Cours
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Gérez vos cours et suivez vos programmes d'enseignement
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-green-700 text-xs sm:text-sm break-words">
                  {success}
                </p>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-600 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-red-700 text-xs sm:text-sm break-words">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="hidden sm:grid sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            {
              label: "Total Cours",
              value: courses.length,
              color: "text-slate-900",
              icon: BookOpen,
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
              ring: "ring-blue-500",
              filter: "all",
              sub: "Tous les cours",
              subIcon: TrendingUp,
            },
            {
              label: "Brouillon",
              value: courses.filter((c) => c.etat === "BROUILLON").length,
              color: "text-yellow-600",
              icon: FileText,
              iconBg: "bg-yellow-100",
              iconColor: "text-yellow-600",
              ring: "ring-yellow-500",
              filter: "BROUILLON",
              sub: "Non publiés",
              subIcon: Activity,
            },
            {
              label: "Publiés",
              value: courses.filter((c) => c.etat === "PUBLIE").length,
              color: "text-green-600",
              icon: CheckCircle,
              iconBg: "bg-green-100",
              iconColor: "text-green-600",
              ring: "ring-green-500",
              filter: "PUBLIE",
              sub: "Disponibles",
              subIcon: Star,
            },
          ].map((stat) => (
            <div
              key={stat.filter}
              onClick={() => setFilterStatus(stat.filter)}
              className={`bg-white border border-slate-100 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${filterStatus === stat.filter ? `ring-2 ${stat.ring}` : ""}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate">
                  {stat.label}
                </p>
                <div
                  className={`p-1.5 ${stat.iconBg} rounded-lg flex-shrink-0`}
                >
                  <stat.icon
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${stat.iconColor}`}
                  />
                </div>
              </div>
              <p className={`text-xl sm:text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <stat.subIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 text-[10px] sm:text-xs truncate">
                  {stat.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filterClassId && filterClassName && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FontAwesomeIcon
                icon={faBookOpen}
                className="w-4 h-4 text-blue-500 flex-shrink-0"
              />
              <p className="text-blue-700 text-xs sm:text-sm font-medium truncate">
                Cours de la classe :{" "}
                <span className="font-bold">{filterClassName}</span>
              </p>
            </div>
            <button
              onClick={() => handleClassFilterChange("")}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
          {/* Row 1: Search + New Course button */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                style={{
                  fontSize: 15,
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par titre, description, matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md font-medium text-sm whitespace-nowrap flex-shrink-0"
            >
              <FontAwesomeIcon
                icon={faPlus}
                style={{
                  fontSize: 15,
                }}
              />
              <span className="hidden sm:inline">Nouveau Cours</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>
          {/* Row 2: Filter + view toggle + schedule + refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[120px]">
              <FontAwesomeIcon
                icon={faFilter}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                style={{
                  fontSize: 13,
                }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                style={{
                  fontSize: 12,
                }}
              />
            </div>

            {/* Class filter */}
            {professorClasses.length > 0 && (
              <div className="relative flex-1 min-w-[130px]">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  style={{
                    fontSize: 13,
                  }}
                />
                <select
                  value={filterClassId || ""}
                  onChange={(e) => handleClassFilterChange(e.target.value)}
                  className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Toutes les classes</option>
                  {professorClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nom || cls.name || cls.titre || `Classe ${cls.id}`}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  style={{
                    fontSize: 12,
                  }}
                />
              </div>
            )}

            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FontAwesomeIcon
                  icon={faTableCells}
                  style={{
                    fontSize: 15,
                  }}
                />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <FontAwesomeIcon
                  icon={faList}
                  style={{
                    fontSize: 15,
                  }}
                />
              </button>
            </div>

            {/* Schedule button */}
            <button
              onClick={() => setActiveTab("schedule-course")}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all shadow-sm font-medium text-xs sm:text-sm flex-shrink-0"
            >
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="text-indigo-600 flex-shrink-0"
                style={{
                  fontSize: 14,
                }}
              />
              <span className="hidden sm:inline">Programmer</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadCourses(filterClassId)}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              title="Actualiser"
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                className={loading ? "animate-spin" : ""}
                style={{
                  fontSize: 15,
                }}
              />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Dates
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
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                {searchTerm || filterStatus !== "all" || filterClassId
                  ? "Aucun cours trouvé"
                  : "Aucun cours créé"}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                {filterClassId
                  ? `Aucun cours trouvé pour la classe ${filterClassName || filterClassId}. Créez un cours associé à cette classe.`
                  : searchTerm || filterStatus !== "all"
                    ? "Essayez de modifier vos critères de recherche ou de filtrage."
                    : "Commencez par créer votre premier cours pour vos étudiants."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={handleCreateCourse}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto text-sm sm:text-base"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="sm:w-5 sm:h-5"
                    style={{
                      fontSize: 16,
                    }}
                  />
                  Créer mon premier cours
                </button>
              )}
            </div>
          </div>
        )}

        {loading && courses.length > 0 && (
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
    </div>
  );
};
export default ProfessorCoursesContent;
