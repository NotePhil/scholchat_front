import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  MapPin,
  PlayCircle,
  PauseCircle,
  XCircle,
  Trash2,
  UserCheck,
} from "lucide-react";
import { coursService } from "../../../../../services/CoursService";
import { classService } from "../../../../../services/ClassService";
import { coursProgrammerService } from "../../../../../services/coursProgrammerService";
import CoursProgrammerForm from "./CoursProgrammerForm/CoursProgrammerForm";
import CoursProgrammerList from "./CoursProgrammerList";
import CoursProgrammerStats from "./CoursProgrammerStats";
import CoursProgrammerViewModal from "../../modals/CoursProgrammerViewModal";
import SessionLauncher from "./LiveSession/SessionLauncher";
import LiveSession from "./LiveSession/LiveSession";
import liveSessionService from "../../../../../services/LiveSessionService";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

const CoursProgrammerContent = () => {
  const location = useLocation();
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
  const [showLauncher, setShowLauncher] = useState(false);
  const [launcherCourse, setLauncherCourse] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [liveSession, setLiveSession] = useState(null); // { scheduledCourse, cours, isModerator }
  const [filterClassId, setFilterClassId] = useState(""); // class filter
  const didMountRef = React.useRef(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    // Support classId from URL query params (e.g. navigating from class details)
    const searchParams = new URLSearchParams(location.search);
    const queryClassId = searchParams.get("classId");
    // Also support legacy localStorage approach as fallback
    const preselectedClassId = queryClassId || localStorage.getItem("selectedClassId");
    if (!queryClassId && localStorage.getItem("selectedClassId")) {
      localStorage.removeItem("selectedClassId");
    }
    if (preselectedClassId) {
      setFilterClassId(preselectedClassId);
    }
    if (userId) {
      setProfessorId(userId);
      loadData(userId, preselectedClassId || null);
    } else {
      setError("ID du professeur non trouvé. Veuillez vous reconnecter.");
      setLoading(false);
    }
    didMountRef.current = true;
  }, []);

  // Reload when user manually changes the class filter dropdown
  useEffect(() => {
    if (!didMountRef.current || !professorId) return;
    loadData(professorId, filterClassId || null);
  }, [filterClassId]);

  // Handle classId passed via URL query param (e.g. navigating from class details while already on this tab)
  useEffect(() => {
    if (!didMountRef.current) return;
    const searchParams = new URLSearchParams(location.search);
    const queryClassId = searchParams.get("classId");
    if (queryClassId && queryClassId !== filterClassId) {
      setFilterClassId(queryClassId);
    }
  }, [location.search]);

  // Handle auto-open if course is passed in state
  useEffect(() => {
    if (location.state?.course && courses.length > 0) {
      setModalMode("create");
      setSelectedScheduledCourse({ cours: location.state.course, coursId: location.state.course.id });
      setShowScheduleModal(true);
      // Clear state after reading to prevent re-opening on manual refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, courses]);

  useEffect(() => {
    filterScheduledCourses();
  }, [scheduledCourses, searchTerm, filterStatus, filterClassId]);

  const loadData = async (professorId, classIdFilter = null) => {
    try {
      setLoading(true);
      setError("");

      const [coursesData, classesData] = await Promise.all([
        coursService.getCoursByProfesseur(professorId),
        classService.obtenirClassesUtilisateur(professorId),
      ]);

      setCourses(coursesData || []);
      setClasses(classesData || []);

      const coursesMap = new Map((coursesData || []).map(c => [String(c.id), c]));

      // Fetch professor's own schedule + class-based schedules in parallel
      // When a specific class is selected, fetch that class only
      // When no filter, fetch ALL accessible classes so we see courses from other professors too
      const classIdsToFetch = classIdFilter
        ? [classIdFilter]
        : (classesData || []).map(c => c.id);

      const [profScheduled, ...classScheduledResults] = await Promise.allSettled([
        coursProgrammerService.obtenirProgrammationParProfesseur(professorId),
        ...classIdsToFetch.map(cId =>
          coursProgrammerService.obtenirProgrammationParClasse(cId)
        ),
      ]);

      const profItems = profScheduled.status === "fulfilled" ? (profScheduled.value || []) : [];
      const classItems = classScheduledResults
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value || []);

      // Merge: class items first (includes other professors), then own items
      const merged = new Map();
      [...classItems, ...profItems].forEach(sc => {
        if (sc?.id) merged.set(String(sc.id), {
          ...sc,
          cours: sc.cours || coursesMap.get(String(sc.coursId)) || null,
        });
      });

      // For scheduled courses whose course object is still missing (from other professors),
      // fetch them individually so they display with the correct title
      const missingCourseIds = Array.from(merged.values())
        .filter(sc => !sc.cours && sc.coursId)
        .map(sc => String(sc.coursId));

      if (missingCourseIds.length > 0) {
        const uniqueIds = [...new Set(missingCourseIds)];
        await Promise.allSettled(
          uniqueIds.map(async (courseId) => {
            try {
              const c = await coursService.getCoursById(courseId);
              if (c) {
                coursesMap.set(String(c.id), c);
                merged.forEach((sc, key) => {
                  if (String(sc.coursId) === String(c.id) && !sc.cours) {
                    merged.set(key, { ...sc, cours: c });
                  }
                });
              }
            } catch { /* ignore */ }
          })
        );
      }

      setScheduledCourses(Array.from(merged.values()));
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterScheduledCourses = () => {
    let filtered = scheduledCourses;

    // Class filter: keep only sessions that include this class in classesIds
    if (filterClassId) {
      filtered = filtered.filter(sc =>
        Array.isArray(sc.classesIds) &&
        sc.classesIds.some(id => String(id) === String(filterClassId))
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sc =>
        sc.cours?.titre?.toLowerCase().includes(searchLower) ||
        sc.lieu?.toLowerCase().includes(searchLower) ||
        sc.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(sc => sc.etatCoursProgramme === filterStatus);
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
    
    // Check if this is a reprogramming case (finished or cancelled course)
    const isReprogramming = scheduledCourse.etatCoursProgramme === "TERMINE" || scheduledCourse.etatCoursProgramme === "ANNULE";
    
    if (isReprogramming) {
      // For reprogramming, create new course programming based on the existing one
      setModalMode("create"); // Use create mode for new programming
      const reprogramData = {
        ...scheduledCourse,
        id: undefined, // Remove ID to create new
        etatCoursProgramme: "PLANIFIE", // Reset to planned state
        dateCoursPrevue: null, // Clear previous date - user will set new date
        dateDebutEffectif: null, // Clear effective dates
        dateFinEffectif: null,
        description: scheduledCourse.description?.includes("Annulé:") 
          ? null // Clear cancellation reason
          : scheduledCourse.description,
        // Keep the course and class information
        coursId: scheduledCourse.coursId || scheduledCourse.cours?.id || "",
        classeId: scheduledCourse.classeId || (scheduledCourse.classesIds && scheduledCourse.classesIds[0]) || "",
      };
      setSelectedScheduledCourse(reprogramData);
    } else {
      // Normal edit for active courses
      setModalMode("edit");
      // Normalize classeId from classesIds array if missing
      const normalizedCourse = {
        ...scheduledCourse,
        coursId: scheduledCourse.coursId || scheduledCourse.cours?.id || "",
        classeId: scheduledCourse.classeId || (scheduledCourse.classesIds && scheduledCourse.classesIds[0]) || "",
      };
      setSelectedScheduledCourse(normalizedCourse);
    }
    
    setError("");
    setSuccess("");
    setShowScheduleModal(true);
  };

  const handleViewSchedule = (scheduledCourse) => {
    setSelectedScheduledCourse(scheduledCourse);
    setShowViewModal(true);
  };

  const handleStartCourse = async (scheduledId) => {
    // Find the scheduled course to get the cours object
    const scheduled = scheduledCourses.find(s => s.id === scheduledId);
    if (!scheduled) return;
    // Show launcher modal for professor to pick mode
    setLauncherCourse(scheduled);
    setShowLauncher(true);
  };

  const handleLaunchSession = async (mode) => {
    if (!launcherCourse) return;
    setLaunchLoading(true);
    try {
      const coursId = launcherCourse.cours?.id || launcherCourse.coursId;
      // 1. Mark course as EN_COURS
      await coursProgrammerService.demarrerCours(launcherCourse.id);
      // 2. Start live session → returns SessionResponseDTO with jitsiJwt
      await liveSessionService.startSession(coursId, mode);
      setShowLauncher(false);
      setLauncherCourse(null);
      // 3. Open live session as moderator
      setLiveSession({ scheduledCourse: launcherCourse, cours: launcherCourse.cours, isModerator: true });
      await loadData(professorId);
    } catch (err) {
      setError("Erreur lors du démarrage: " + (err.response?.data?.message || err.message));
    } finally {
      setLaunchLoading(false);
    }
  };

  const handleJoinSession = (scheduledCourse) => {
    setLiveSession({ scheduledCourse, cours: scheduledCourse.cours, isModerator: false });
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

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const handleDeleteCourse = async (scheduledId) => {
    try {
      setLoading(true);
      setError("");
      await coursProgrammerService.supprimerCoursProgramme(scheduledId);
      setSuccess("Cours supprimé avec succès !");
      setConfirmDeleteId(null);
      await loadData(professorId);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError("Erreur lors de la suppression: " + err.message);
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
      <div className="flex items-center justify-center py-20">
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
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md flex-shrink-0">
              <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
                Programmation des Cours
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Planifiez et gérez les sessions de vos cours
              </p>
            </div>
          </div>
        </div>

        {/* Class context banner */}
        {filterClassId && (
          <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-700 text-xs sm:text-sm font-medium">
              <Users size={14} className="flex-shrink-0" />
              Cours publics de la classe : <strong>{classes.find(c => c.id === filterClassId)?.nom || filterClassId}</strong>
            </div>
            <button onClick={() => { setFilterClassId(""); loadData(professorId); }}
              className="text-indigo-400 hover:text-indigo-600 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages d'alerte */}
        {success && (
          <div className="mb-3 sm:mb-4 bg-green-50 border border-green-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 text-xs sm:text-sm break-words">{success}</p>
              </div>
              <button onClick={() => setSuccess("")} className="text-green-400 hover:text-green-600 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 sm:mb-4 bg-red-50 border border-red-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-xs sm:text-sm break-words">{error}</p>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <CoursProgrammerStats 
          scheduledCourses={scheduledCourses} 
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Barre de contrôle */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-8">
          {/* Row 1: Search + Add button */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Rechercher par cours, lieu, classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleScheduleCourse}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md font-medium text-sm disabled:opacity-50 whitespace-nowrap flex-shrink-0"
            >
              <Plus size={15} className="flex-shrink-0" />
              <span className="hidden sm:inline">Programmer un Cours</span>
              <span className="sm:hidden">Programmer</span>
            </button>
          </div>

          {/* Row 2: Filters + controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class filter */}
            <div className="relative flex-1 min-w-[150px]">
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            {/* Status filter */}
            <div className="relative flex-1 min-w-[130px]">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="PLANIFIE">Planifié</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            {/* Page size */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 flex-shrink-0">
              <Hash className="text-slate-400" size={13} />
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-slate-500 text-xs hidden sm:inline">/ page</span>
            </div>

            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <List size={15} />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Results count */}
          {filteredScheduledCourses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{filteredScheduledCourses.length}</span>{" "}
                {filteredScheduledCourses.length === 1 ? "cours trouvé" : "cours trouvés"}
                {searchTerm && <span> pour "<span className="font-medium text-slate-700">{searchTerm}</span>"</span>}
              </p>
            </div>
          )}
        </div>

        {/* Liste des cours programmés - Updated for single column on small screens */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredScheduledCourses
              .slice(0, pageSize)
              .map((scheduledCourse) => {
                const classeId = scheduledCourse.classeId || (scheduledCourse.classesIds && scheduledCourse.classesIds[0]);
                const classeName = classeId ? (classes.find(c => c.id === classeId)?.nom || "Classe") : "";
                return (
                <div
                  key={scheduledCourse.id}
                  className="w-full min-w-0 overflow-hidden"
                >
                  <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Ownership banner */}
                    {String(scheduledCourse.professeurId) === String(professorId) ? (
                      <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg w-fit text-xs font-medium text-indigo-700">
                        <UserCheck className="w-3 h-3 flex-shrink-0" />
                        Votre cours
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg w-fit text-xs font-medium text-amber-700">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        Cours d'un autre professeur
                      </div>
                    )}
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
                            {scheduledCourse.cours?.titre || scheduledCourse.titre || "Cours sans titre"}
                          </h3>
                          {classeName && (
                            <p className="text-xs text-slate-500 mt-0.5 break-words">
                              {classeName}
                            </p>
                          )}
                          {scheduledCourse.lieu && (
                            <p className="text-xs sm:text-sm text-slate-600 mt-1 break-words flex items-center">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              {scheduledCourse.lieu}
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
                      {/* Always show planned date */}
                      {scheduledCourse.dateCoursPrevue && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            Prévu: {new Date(scheduledCourse.dateCoursPrevue).toLocaleDateString("fr-FR")}{" "}
                            à{" "}
                            {new Date(scheduledCourse.dateCoursPrevue).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {/* Show effective dates only for EN_COURS or TERMINE */}
                      {scheduledCourse.etatCoursProgramme !== "PLANIFIE" && scheduledCourse.dateDebutEffectif && (
                        <div className="flex items-center text-xs text-green-600">
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            Début: {new Date(scheduledCourse.dateDebutEffectif).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {scheduledCourse.etatCoursProgramme === "TERMINE" && scheduledCourse.dateFinEffectif && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="break-words">
                            Fin: {new Date(scheduledCourse.dateFinEffectif).toLocaleTimeString("fr-FR", {
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
                                .map((cId) => {
                                  const classe = classes.find(
                                    (c) => c.id === cId
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
                    <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-slate-100">
                      {/* Start/Cancel/Edit available to all professors with access */}
                      {scheduledCourse.etatCoursProgramme === "PLANIFIE" && (
                        <button
                          onClick={() => handleStartCourse(scheduledCourse.id)}
                          className="flex-1 min-w-[80px] bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <PlayCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Démarrer</span>
                        </button>
                      )}
                      {scheduledCourse.etatCoursProgramme === "EN_COURS" && (
                        <>
                          <button
                            onClick={() => handleEndCourse(scheduledCourse.id)}
                            className="flex-1 min-w-[80px] bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                            <PauseCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Terminer</span>
                          </button>
                          <button
                            onClick={() => handleJoinSession(scheduledCourse)}
                            className="flex-1 min-w-[80px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                          >
                            <PlayCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Rejoindre</span>
                          </button>
                        </>
                      )}
                      {(scheduledCourse.etatCoursProgramme === "PLANIFIE" || scheduledCourse.etatCoursProgramme === "EN_COURS") && (
                        <button
                          onClick={() => setConfirmCancelId(scheduledCourse.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="hidden sm:inline">Annuler</span>
                        </button>
                      )}
                      {/* View available to all */}
                      <button
                        onClick={() => handleViewSchedule(scheduledCourse)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Voir</span>
                      </button>
                      {/* Edit/Reprogrammer available to all */}
                      <button
                        onClick={() => handleEditSchedule(scheduledCourse)}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        {scheduledCourse.etatCoursProgramme === "TERMINE" || scheduledCourse.etatCoursProgramme === "ANNULE" ? (
                          <>
                            <CalendarPlus className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Reprogrammer</span>
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Modifier</span>
                          </>
                        )}
                      </button>
                      {/* Delete restricted to creator only */}
                      {String(scheduledCourse.professeurId) === String(professorId) && (
                        <button
                          onClick={() => setConfirmDeleteId(scheduledCourse.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
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

        {/* Session Launcher Modal */}
        {showLauncher && launcherCourse && (
          <SessionLauncher
            cours={launcherCourse.cours}
            loading={launchLoading}
            onStart={handleLaunchSession}
            onClose={() => { setShowLauncher(false); setLauncherCourse(null); }}
          />
        )}

        {/* Live Session Full-screen */}
        {liveSession && (
          <LiveSession
            scheduledCourse={liveSession.scheduledCourse}
            cours={liveSession.cours}
            isModerator={liveSession.isModerator}
            onClose={() => { setLiveSession(null); loadData(professorId); }}
          />
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
            currentUserId={professorId}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Supprimer le cours programmé</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Cette action est irréversible. Le cours programmé sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteCourse(confirmDeleteId)}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Suppression...</span></> : <span>Supprimer</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Annuler le cours programmé</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Êtes-vous sûr de vouloir annuler ce cours ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="flex-1 py-3 text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  handleCancelCourse(confirmCancelId, "Annulé par le professeur");
                  setConfirmCancelId(null);
                }}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Annulation...</span></>
                  : <span>Confirmer</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursProgrammerContent;
