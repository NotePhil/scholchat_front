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
  Calendar,
  Clock,
  Users,
  Eye,
  Edit2,
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

  // Auto-clear messages
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

  if (loading && scheduledCourses.length === 0) {
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
          <p className="text-slate-600 font-medium text-sm sm:text-base break-words">
            Chargement des programmations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <CalendarPlus className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent break-words hyphens-auto">
                Programmation des Cours
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm break-words">
                Planifiez et gérez les sessions de vos cours
              </p>
            </div>
          </div>
        </div>

        {/* Messages d'alerte */}
        {success && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start min-w-0 flex-1">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-green-800 font-medium text-sm">Succès</p>
                  <p className="text-green-700 text-xs sm:text-sm mt-1 break-words hyphens-auto overflow-wrap-break-word">
                    {success}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-600 flex-shrink-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start min-w-0 flex-1">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-red-800 font-medium text-sm">Erreur</p>
                  <p className="text-red-700 text-xs sm:text-sm mt-1 break-words hyphens-auto overflow-wrap-break-word">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <CoursProgrammerStats scheduledCourses={scheduledCourses} />

        {/* Barre de contrôle */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-6">
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 flex-shrink-0"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher par cours, lieu, classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-3 min-[480px]:gap-2 sm:gap-4">
              <div className="relative flex-1 min-[480px]:flex-none min-w-0">
                <Filter
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 flex-shrink-0"
                  size={14}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-8 sm:pl-12 pr-6 sm:pr-8 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
                <ChevronDown
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 flex-shrink-0"
                  size={14}
                />
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 shadow-sm min-w-0 self-center min-[480px]:self-auto">
                <Hash className="text-slate-400 flex-shrink-0" size={14} />
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="text-xs sm:text-sm bg-transparent border-none focus:ring-0 cursor-pointer min-w-0"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-slate-600 text-xs hidden sm:inline whitespace-nowrap">
                  par page
                </span>
              </div>

              <div className="flex bg-slate-100 rounded-lg sm:rounded-xl p-1 self-center min-[480px]:self-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 sm:p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-center min-[480px]:self-auto"
                title="Actualiser les données"
              >
                <RefreshCw
                  size={16}
                  className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>

              <button
                onClick={handleScheduleCourse}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Plus size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Programmer un Cours</span>
                <span className="sm:hidden">Programmer</span>
              </button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {filteredScheduledCourses.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
              <p className="text-xs sm:text-sm text-slate-600 break-words hyphens-auto overflow-wrap-break-word">
                <span className="font-medium text-slate-800">
                  {filteredScheduledCourses.length}
                </span>{" "}
                {filteredScheduledCourses.length === 1
                  ? "cours trouvé"
                  : "cours trouvés"}
                {searchTerm && (
                  <span>
                    {" "}
                    pour "
                    <span className="font-medium break-words hyphens-auto overflow-wrap-break-word">
                      {searchTerm}
                    </span>
                    "
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

        {/* Liste des cours programmés - Updated for single column on small screens */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredScheduledCourses
              .slice(0, pageSize)
              .map((scheduledCourse) => (
                <div
                  key={scheduledCourse.id}
                  className="w-full min-w-0 overflow-hidden"
                >
                  <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                          {scheduledCourse.cours?.titre
                            ?.split(" ")
                            .map((word) => word.charAt(0))
                            .join("")
                            .substring(0, 2)
                            .toUpperCase() || "CP"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight break-words hyphens-auto overflow-wrap-break-word">
                            {scheduledCourse.cours?.titre}
                          </h3>
                          {scheduledCourse.lieu && (
                            <p className="text-xs sm:text-sm text-slate-600 mt-1 break-words">
                              📍 {scheduledCourse.lieu}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                          scheduledCourse.etatCoursProgramme === "PLANIFIE"
                            ? "bg-blue-100 text-blue-700"
                            : scheduledCourse.etatCoursProgramme === "EN_COURS"
                            ? "bg-green-100 text-green-700"
                            : scheduledCourse.etatCoursProgramme === "TERMINE"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {scheduledCourse.etatCoursProgramme === "PLANIFIE" &&
                          "Planifié"}
                        {scheduledCourse.etatCoursProgramme === "EN_COURS" &&
                          "En cours"}
                        {scheduledCourse.etatCoursProgramme === "TERMINE" &&
                          "Terminé"}
                        {scheduledCourse.etatCoursProgramme === "ANNULE" &&
                          "Annulé"}
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-2 mb-4 flex-1">
                      {scheduledCourse.dateDebut && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            {new Date(
                              scheduledCourse.dateDebut
                            ).toLocaleDateString("fr-FR")}{" "}
                            à{" "}
                            {new Date(
                              scheduledCourse.dateDebut
                            ).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {scheduledCourse.dateFin && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            Jusqu'à{" "}
                            {new Date(
                              scheduledCourse.dateFin
                            ).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {scheduledCourse.classesIds &&
                        scheduledCourse.classesIds.length > 0 && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Users className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="break-words hyphens-auto overflow-wrap-break-word">
                              {scheduledCourse.classesIds
                                .map((classId) => {
                                  const classe = classes.find(
                                    (c) => c.id === classId
                                  );
                                  return classe?.nom;
                                })
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      {scheduledCourse.description && (
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed break-words hyphens-auto overflow-wrap-break-word line-clamp-2 mt-2">
                          {scheduledCourse.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleViewSchedule(scheduledCourse)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Voir</span>
                      </button>
                      <button
                        onClick={() => handleEditSchedule(scheduledCourse)}
                        className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Modifier</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
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
        )}

        {/* Empty State for Grid View */}
        {viewMode === "grid" &&
          filteredScheduledCourses.length === 0 &&
          !loading && (
            <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <CalendarPlus className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                  {searchTerm || filterStatus !== "all"
                    ? "Aucun cours programmé trouvé"
                    : "Aucun cours programmé"}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto break-words">
                  {searchTerm || filterStatus !== "all"
                    ? "Essayez de modifier vos critères de recherche ou de filtrage."
                    : "Commencez par programmer votre premier cours."}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <button
                    onClick={handleScheduleCourse}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium mx-auto text-sm sm:text-base"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      Programmer mon premier cours
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Overlay de chargement */}
        {loading && scheduledCourses.length > 0 && (
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
                <p className="text-slate-700 font-medium text-sm sm:text-base whitespace-nowrap">
                  Traitement en cours...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
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
