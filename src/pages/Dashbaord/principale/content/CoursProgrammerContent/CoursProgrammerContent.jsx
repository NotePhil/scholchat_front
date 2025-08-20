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
  const [selectedScheduledCourse, setSelectedScheduledCourse] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterScheduledCourses();
  }, [scheduledCourses, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const professorId = localStorage.getItem("userId");
      if (!professorId) {
        throw new Error("ID du professeur non trouvé");
      }

      const [coursesData, classesData] = await Promise.all([
        coursService.getCoursByProfesseur(professorId),
        classService.obtenirClassesUtilisateur(professorId),
      ]);

      setCourses(coursesData || []);
      setClasses(classesData || []);

      const scheduledPromises = (coursesData || []).map((course) =>
        coursProgrammerService.obtenirProgrammationParCours(course.id)
      );
      const scheduledResults = await Promise.allSettled(scheduledPromises);

      const allScheduledCourses = scheduledResults
        .filter((result) => result.status === "fulfilled" && result.value)
        .flatMap((result, index) =>
          result.value.map((scheduled) => ({
            ...scheduled,
            cours: coursesData[index],
          }))
        );

      setScheduledCourses(allScheduledCourses);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterScheduledCourses = () => {
    let filtered = scheduledCourses;

    if (searchTerm) {
      filtered = filtered.filter(
        (scheduled) =>
          scheduled.cours?.titre
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          scheduled.lieu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classes
            .find((c) => c.id === scheduled.classeId)
            ?.nom?.toLowerCase()
            .includes(searchTerm.toLowerCase())
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
      setLoading(true);
      setError("");
      setSuccess("");

      if (modalMode === "create") {
        await coursProgrammerService.programmerCours(scheduleData);
        setSuccess("Cours programmé avec succès !");
      } else {
        await coursProgrammerService.updateScheduledCours(
          selectedScheduledCourse.id,
          scheduleData
        );
        setSuccess("Programmation modifiée avec succès !");
      }

      setShowScheduleModal(false);
      setSelectedScheduledCourse(null);
      loadData();
    } catch (err) {
      console.error("Error in handleFormSubmit:", err);
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCourse = () => {
    setModalMode("create");
    setSelectedScheduledCourse(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (scheduledCourse) => {
    setModalMode("edit");
    setSelectedScheduledCourse(scheduledCourse);
    setShowScheduleModal(true);
  };

  const handleStartCourse = async (scheduledId) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      await coursProgrammerService.updateScheduledCours(scheduledId, {
        etatCoursProgramme: "EN_COURS",
        dateDebutEffectif: now,
      });
      setSuccess("Cours démarré avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors du démarrage: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCourse = async (scheduledId) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      await coursProgrammerService.updateScheduledCours(scheduledId, {
        etatCoursProgramme: "TERMINE",
        dateFinEffectif: now,
      });
      setSuccess("Cours terminé avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors de la fin: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCourse = async (scheduledId, reason = "") => {
    try {
      setLoading(true);
      await coursProgrammerService.updateScheduledCours(scheduledId, {
        etatCoursProgramme: "ANNULE",
        description: reason ? `Annulé: ${reason}` : "Annulé",
      });
      setSuccess("Cours annulé avec succès !");
      loadData();
    } catch (err) {
      setError("Erreur lors de l'annulation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Programmation des Cours
              </h1>
              <p className="text-slate-600 mt-1">
                Planifiez et gérez les sessions de vos cours
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
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

        {/* Error Message */}
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

        {/* Statistics */}
        <CoursProgrammerStats scheduledCourses={scheduledCourses} />

        {/* Controls */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            {/* Search and Filter Row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Rechercher par cours, lieu, classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                {/* Status Filter */}
                <div className="relative">
                  <Filter
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-12 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer min-w-[160px]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="PLANIFIE">Planifié</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>

                {/* Page Size Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 whitespace-nowrap">
                    Afficher:
                  </span>
                  <div className="relative">
                    <Hash
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                      }
                      className="pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer min-w-[100px]"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                  <span className="text-sm text-slate-600 whitespace-nowrap">
                    par page
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Vue en tableau"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => loadData()}
                className="p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Actualiser les données"
              >
                <RefreshCw size={20} />
              </button>

              {/* Schedule Course Button */}
              <button
                onClick={handleScheduleCourse}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Programmer un Cours</span>
                <span className="sm:hidden">Programmer</span>
              </button>
            </div>
          </div>

          {/* Results Summary */}
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

        {/* Course List */}
        <CoursProgrammerList
          scheduledCourses={filteredScheduledCourses}
          viewMode={viewMode}
          onEdit={handleEditSchedule}
          onStart={handleStartCourse}
          onEnd={handleEndCourse}
          onCancel={handleCancelCourse}
          onScheduleCourse={handleScheduleCourse}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          classes={classes}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Loading Overlay */}
        {loading && scheduledCourses.length > 0 && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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

        {/* Schedule Modal */}
        <CoursProgrammerForm
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={handleFormSubmit}
          modalMode={modalMode}
          selectedScheduledCourse={selectedScheduledCourse}
          courses={courses}
          classes={classes}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CoursProgrammerContent;
