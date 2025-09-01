import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertCircle,
  ChevronDown,
  Grid,
  List,
  RefreshCw,
  CalendarPlus,
  Hash,
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import { classService } from "../../../../../services/ClassService";
import { coursProgrammerService } from "../../../../../services/coursProgrammerService";
import CoursProgrammerForm from "./CoursProgrammerForm/CoursProgrammerForm";
import CoursProgrammerList from "./CoursProgrammerList";
import CoursProgrammerStats from "./CoursProgrammerStats";
import CoursProgrammerViewModal from "../../modals/CoursProgrammerViewModal";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

const CoursProgrammerContent = () => {
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredScheduledCourses, setFilteredScheduledCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [pageSize, setPageSize] = useState(10);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedScheduledCourse, setSelectedScheduledCourse] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [professorId, setProfessorId] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setProfessorId(userId);
      loadData(userId);
    } else {
      setError("ID du professeur non trouvé. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterScheduledCourses();
  }, [scheduledCourses, searchTerm, filterStatus]);

  const loadData = async (professorId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Chargement des données pour le professeur:", professorId);

      const [coursesData, classesData] = await Promise.all([
        coursService.getCoursByProfesseur(professorId),
        classService.obtenirClassesUtilisateur(professorId),
      ]);

      console.log("Cours récupérés:", coursesData);
      console.log("Classes récupérées:", classesData);

      setCourses(coursesData || []);
      setClasses(classesData || []);

      // Chargement de la programmation pour chaque cours
      const scheduledPromises = (coursesData || []).map(async (course) => {
        try {
          const programmation =
            await coursProgrammerService.obtenirProgrammationParCours(
              course.id
            );
          return { course, programmation };
        } catch (error) {
          console.warn(
            `Erreur lors du chargement de la programmation pour le cours ${course.id}:`,
            error
          );
          return { course, programmation: [] };
        }
      });

      const scheduledResults = await Promise.allSettled(scheduledPromises);

      const allScheduledCourses = [];
      scheduledResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.programmation) {
          const { course, programmation } = result.value;
          if (Array.isArray(programmation)) {
            programmation.forEach((scheduled) => {
              allScheduledCourses.push({
                ...scheduled,
                cours: course,
              });
            });
          }
        }
      });

      console.log("Cours programmés chargés:", allScheduledCourses);
      setScheduledCourses(allScheduledCourses);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterScheduledCourses = () => {
    let filtered = scheduledCourses;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (scheduled) =>
          scheduled.cours?.titre?.toLowerCase().includes(searchLower) ||
          scheduled.lieu?.toLowerCase().includes(searchLower) ||
          scheduled.description?.toLowerCase().includes(searchLower) ||
          classes
            .find((c) => scheduled.classesIds?.includes(c.id))
            ?.nom?.toLowerCase()
            .includes(searchLower)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (scheduled) => scheduled.etatCoursProgramme === filterStatus
      );
    }

    setFilteredScheduledCourses(filtered);
  };

  const handleFormSubmit = async (scheduleData) => {
    try {
      if (!professorId) {
        throw new Error("ID du professeur non disponible");
      }

      setLoading(true);
      setError("");
      setSuccess("");

      console.log("Données du formulaire reçues:", scheduleData);

      // Ajout de l'ID du professeur aux données de programmation
      const dataWithProfessor = {
        ...scheduleData,
        professeurId: professorId,
      };

      console.log("Données à envoyer avec professeurId:", dataWithProfessor);

      let result;
      if (modalMode === "create") {
        result = await coursProgrammerService.programmerCours(
          dataWithProfessor
        );
        setSuccess("Cours programmé avec succès !");
        console.log("Cours créé:", result);
      } else {
        result = await coursProgrammerService.mettreAJourCoursProgramme(
          selectedScheduledCourse.id,
          dataWithProfessor
        );
        setSuccess("Programmation modifiée avec succès !");
        console.log("Cours mis à jour:", result);
      }

      setShowScheduleModal(false);
      setSelectedScheduledCourse(null);

      // Rechargement des données après succès
      await loadData(professorId);
    } catch (err) {
      console.error("Erreur dans handleFormSubmit:", err);
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCourse = () => {
    if (!professorId) {
      setError("ID du professeur non disponible. Veuillez vous reconnecter.");
      return;
    }
    setModalMode("create");
    setSelectedScheduledCourse(null);
    setError("");
    setSuccess("");
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (scheduledCourse) => {
    if (!professorId) {
      setError("ID du professeur non disponible. Veuillez vous reconnecter.");
      return;
    }
    setModalMode("edit");
    setSelectedScheduledCourse(scheduledCourse);
    setError("");
    setSuccess("");
    setShowScheduleModal(true);
  };

  const handleViewSchedule = (scheduledCourse) => {
    setSelectedScheduledCourse(scheduledCourse);
    setShowViewModal(true);
  };

  const handleStartCourse = async (scheduledId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Démarrage du cours:", scheduledId);

      await coursProgrammerService.demarrerCours(scheduledId);
      setSuccess("Cours démarré avec succès !");

      // Rechargement des données
      await loadData(professorId);
    } catch (err) {
      console.error("Erreur lors du démarrage:", err);
      setError("Erreur lors du démarrage: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCourse = async (scheduledId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Fin du cours:", scheduledId);

      await coursProgrammerService.terminerCours(scheduledId);
      setSuccess("Cours terminé avec succès !");

      // Rechargement des données
      await loadData(professorId);
    } catch (err) {
      console.error("Erreur lors de la fin:", err);
      setError("Erreur lors de la fin: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCourse = async (scheduledId, reason = "") => {
    try {
      setLoading(true);
      setError("");

      console.log("Annulation du cours:", scheduledId, "Raison:", reason);

      await coursProgrammerService.annulerCours(scheduledId, reason);
      setSuccess("Cours annulé avec succès !");

      // Rechargement des données
      await loadData(professorId);
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err);
      setError("Erreur lors de l'annulation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
  };

  const handleRefresh = () => {
    if (!professorId) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        setProfessorId(userId);
        loadData(userId);
      } else {
        setError("ID du professeur non trouvé. Veuillez vous reconnecter.");
      }
    } else {
      loadData(professorId);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  if (loading && scheduledCourses.length === 0) {
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
            Chargement des programmations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Programmation des Cours
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Planifiez et gérez les sessions de vos cours
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
                onClick={clearMessages}
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
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <CoursProgrammerStats scheduledCourses={scheduledCourses} />

        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 sm:p-6 shadow-lg mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher par cours, lieu, classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-8 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="PLANIFIE">Planifié</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                    Afficher:
                  </span>
                  <div className="relative">
                    <Hash
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={14}
                    />
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                      }
                      className="pl-8 pr-8 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer min-w-[80px] sm:min-w-[100px] text-sm sm:text-base"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={14}
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                    par page
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Vue en grille"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Vue en tableau"
                >
                  <List size={16} />
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualiser les données"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </button>

              <button
                onClick={handleScheduleCourse}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Programmer un Cours</span>
                <span className="sm:hidden">Programmer</span>
              </button>
            </div>
          </div>

          {filteredScheduledCourses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {filteredScheduledCourses.length}
                </span>{" "}
                {filteredScheduledCourses.length === 1
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
                      {filterStatus === "PLANIFIE" && "Planifié"}
                      {filterStatus === "EN_COURS" && "En cours"}
                      {filterStatus === "TERMINE" && "Terminé"}
                      {filterStatus === "ANNULE" && "Annulé"}
                    </span>
                    "
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <CoursProgrammerList
          scheduledCourses={filteredScheduledCourses}
          viewMode={viewMode}
          onEdit={handleEditSchedule}
          onView={handleViewSchedule}
          onStart={handleStartCourse}
          onEnd={handleEndCourse}
          onCancel={handleCancelCourse}
          onScheduleCourse={handleScheduleCourse}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          classes={classes}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />

        {loading && scheduledCourses.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center space-x-3">
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

        <CoursProgrammerForm
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedScheduledCourse(null);
            setError("");
            setSuccess("");
          }}
          onSubmit={handleFormSubmit}
          modalMode={modalMode}
          selectedScheduledCourse={selectedScheduledCourse}
          courses={courses}
          classes={classes}
          loading={loading}
        />

        {showViewModal && (
          <CoursProgrammerViewModal
            scheduledCourse={selectedScheduledCourse}
            onClose={() => {
              setShowViewModal(false);
              setSelectedScheduledCourse(null);
            }}
            onEdit={handleEditSchedule}
            onStart={handleStartCourse}
            onEnd={handleEndCourse}
            onCancel={handleCancelCourse}
            classes={classes}
          />
        )}
      </div>
    </div>
  );
};

export default CoursProgrammerContent;
