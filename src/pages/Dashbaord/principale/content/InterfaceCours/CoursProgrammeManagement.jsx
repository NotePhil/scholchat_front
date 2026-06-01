import React, { useState, useEffect } from "react";
import {
  Book,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  Video,
  FileText,
  Activity,
  Eye,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  GraduationCap,
  Download,
  Image,
  FileIcon,
  Pause,
  Plus,
  Loader,
  Radio,
} from "lucide-react";
import CourseDetailsView from './CourseDetailsView';
import LiveSession from '../CoursProgrammerContent/LiveSession/LiveSession';

const Pagination = ({ total, page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const withEllipsis = pages.reduce((acc, p, i, arr) => {
    if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
    acc.push(p);
    return acc;
  }, []);
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">{total} élément{total !== 1 ? 's' : ''} · page {page}/{totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(p => Math.max(1, p - 1))}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >‹</button>
        {withEllipsis.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >{p}</button>
          )
        )}
        <button
          disabled={page === totalPages}
          onClick={() => onPage(p => Math.min(totalPages, p + 1))}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >›</button>
      </div>
    </div>
  );
};

const CoursProgrammeManagement = ({ selectedClass, onBack, onScheduleCourse, userRole, tabData }) => {
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [classExercises, setClassExercises] = useState([]);
  const [classAllCourses, setClassAllCourses] = useState([]);
  const [classNamesMap, setClassNamesMap] = useState({}); // classeId -> nom
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState("PROGRAMMED"); // PROGRAMMED, ALL_COURSES, EXERCISES
  const [loading, setLoading] = useState(false);

  // Pagination
  const PAGE_SIZE = 6;
  const [pageProgrammed, setPageProgrammed] = useState(1);
  const [pageAllCourses, setPageAllCourses] = useState(1);
  const [pageExercises, setPageExercises] = useState(1);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [selectedCourse, setSelectedCourse] = useState(tabData?.courseId ? { id: tabData.courseId, coursId: tabData.courseId } : null);
  const [showCourseDetail, setShowCourseDetail] = useState(!!tabData?.courseId);
  const [courseResources, setCourseResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveSession, setLiveSession] = useState(null);
  const [activeSessions, setActiveSessions] = useState({}); // { coursId: sessionData }

  const parentIdCPM = localStorage.getItem("userId");
  const isParentRoleCPM = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
  const userId = isParentRoleCPM ? (localStorage.getItem("selectedChildId") || parentIdCPM) : parentIdCPM;
  const isProfessorOrAdmin = userRole === 'professor' || userRole === 'admin' || userRole?.includes('PROFESSOR') || userRole?.includes('ADMIN');

  const resolveClassNames = async (courses) => {
    const { classService } = await import('../../../../../services/ClassService').catch(() => ({ classService: null }));
    if (!classService) return;
    const ids = [...new Set(
      courses.flatMap(c => c.classesIds || (c.classeId ? [c.classeId] : []))
    )].filter(Boolean);
    if (ids.length === 0) return;
    const entries = await Promise.allSettled(ids.map(id => classService.obtenirClasseParId(id)));
    const map = {};
    ids.forEach((id, i) => {
      if (entries[i].status === 'fulfilled' && entries[i].value?.nom) {
        map[id] = entries[i].value.nom;
      }
    });
    setClassNamesMap(prev => ({ ...prev, ...map }));
  };

  const getCoursClassName = (course) => {
    if (selectedClass) return selectedClass.nom;
    const id = (course.classesIds && course.classesIds[0]) || course.classeId;
    return id ? (classNamesMap[id] || id) : '';
  };

  // Poll active sessions + sync course statuses
  useEffect(() => {
    if (scheduledCourses.length === 0) return;
    const checkSessions = async () => {
      const { default: liveSessionService } = await import('../../../../../services/LiveSessionService');
      const results = {};
      await Promise.all(
        scheduledCourses
          .filter(c => c.etatCoursProgramme !== 'ANNULE')
          .map(async (c) => {
            const cId = c.cours?.id || c.coursId;
            if (!cId || results[cId] !== undefined) return;
            try {
              const session = await liveSessionService.getActiveSession(cId);
              results[cId] = session; // active session found
            } catch (e) {
              results[cId] = null; // no active session
            }
          })
      );
      setActiveSessions(prev => {
        const next = {};
        Object.keys(results).forEach(k => { if (results[k]) next[k] = results[k]; });
        return next;
      });
      // Sync etatCoursProgramme based on session state
      setScheduledCourses(prev => prev.map(c => {
        const cId = c.cours?.id || c.coursId;
        if (!(cId in results)) return c; // not checked, leave as-is
        const hasSession = !!results[cId];
        if (hasSession && c.etatCoursProgramme === 'PLANIFIE') {
          return { ...c, etatCoursProgramme: 'EN_COURS' };
        }
        if (!hasSession && c.etatCoursProgramme === 'EN_COURS') {
          // Session ended → mark as TERMINE
          return { ...c, etatCoursProgramme: 'TERMINE' };
        }
        return c;
      }));
    };
    checkSessions();
    const interval = setInterval(checkSessions, 15000);
    return () => clearInterval(interval);
  }, [scheduledCourses.length]);

  // Fetch courses when component mounts
  useEffect(() => {
    if (selectedClass) {
      fetchCoursesForClass();
    } else {
      fetchAllUserCourses();
    }
  }, [selectedClass]);

  const fetchCoursesForClass = async () => {
    if (!selectedClass) {
      fetchAllUserCourses();
      return;
    }
    try {
      setLoading(true);
      setError("");

      console.log("Fetching courses for class:", selectedClass.id);
      console.log("Current user ID:", userId);

      // Import services
      const { coursProgrammerService } = await import(
        "../../../../../services/coursProgrammerService"
      );
      const { coursService } = await import(
        "../../../../../services/CoursService"
      );

      // Fetch from multiple sources in parallel - use allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        coursProgrammerService.obtenirProgrammationParParticipant(userId),
        coursProgrammerService.obtenirProgrammationParClasse(selectedClass.id),
        coursService.getCoursAccessibles(userId).catch(() => []),
        import("../../../../../services/exerciseProgrammerService").then(m => 
          m.exerciseProgrammerService.getExercisesProgrammesParClasse(selectedClass.id)
        ).catch(() => []),
        import("../../../../../services/exerciseService").then(m => 
          m.exerciseService.getExercisesAccessibles(userId)
        ).catch(() => [])
      ]);

      const participantCourses = results[0].status === 'fulfilled' ? results[0].value : [];
      const classCoursesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const generalCourses = results[2].status === 'fulfilled' ? results[2].value : [];
      const exerciseProgrammerData = results[3].status === 'fulfilled' ? results[3].value : [];
      const accessibleExercisesData = results[4].status === 'fulfilled' ? results[4].value : [];

      console.log("Data loaded:", { 
        participantCourses: participantCourses?.length || 0, 
        classCoursesData: classCoursesData?.length || 0,
        generalCourses: generalCourses?.length || 0,
        exercises: exerciseProgrammerData?.length || 0
      });

      // Handle Exercises - Merge and Deduplicate
      const exercisesMap = new Map();
      
      // Add exercises programmed for this class
      if (Array.isArray(exerciseProgrammerData)) {
        exerciseProgrammerData.forEach(exo => {
          exercisesMap.set(exo.id, { ...exo, type: 'EXERCISE', source: 'class' });
        });
      }
      
      // Add globally accessible/public exercises
      if (Array.isArray(accessibleExercisesData)) {
        accessibleExercisesData.forEach(exo => {
          if (!exercisesMap.has(exo.id)) {
            exercisesMap.set(exo.id, { ...exo, type: 'EXERCISE', source: 'public' });
          }
        });
      }
      
      const allExercises = Array.from(exercisesMap.values());
      setClassExercises(allExercises);
      
      if (allExercises.length > 0) {
        showToast(`${allExercises.length} exercices chargés`, 'success');
      }

      // Handle General Courses - Filter by class level/section if possible to avoid unrelated courses
      if (Array.isArray(generalCourses)) {
        const filteredGeneral = generalCourses.filter(c => 
          !selectedClass || 
          c.niveau === selectedClass.niveau || 
          (c.matiere && selectedClass.matiere && c.matiere.toLowerCase().includes(selectedClass.matiere.toLowerCase()))
        );
        setClassAllCourses(filteredGeneral.map(c => ({...c, type: 'COURSE'})));
      } else {
        setClassAllCourses([]);
      }

      // Merge and deduplicate scheduled courses — only keep courses for this specific class
      const coursesMap = new Map();
      // Only use class-specific courses, NOT participant-wide courses
      if (Array.isArray(classCoursesData)) {
        classCoursesData.forEach(c => coursesMap.set(c.id, c));
      }

      const allScheduledCourses = Array.from(coursesMap.values());
      
      // Enrich the scheduled courses with full course details
      const enrichedCourses = await Promise.all(
        allScheduledCourses.map(async (scheduledCourse) => {
          try {
            if (scheduledCourse.coursId) {
              const fullCourseDetails = await coursService.getCoursById(
                scheduledCourse.coursId
              );
              return {
                ...scheduledCourse,
                cours: fullCourseDetails,
                type: 'PROGRAMMED_COURSE'
              };
            } else {
              return {
                ...scheduledCourse,
                cours: scheduledCourse.cours || {
                  titre: scheduledCourse.titre || "Cours sans titre",
                  description: scheduledCourse.description || "Description non disponible",
                },
                type: 'PROGRAMMED_COURSE'
              };
            }
          } catch (courseError) {
            console.warn(`Could not enrich course ${scheduledCourse.id}:`, courseError);
            return {
              ...scheduledCourse,
              cours: {
                id: scheduledCourse.coursId,
                titre: scheduledCourse.titre || (scheduledCourse.coursId ? `Cours ${scheduledCourse.coursId.substring(0, 8)}` : "Cours sans titre"),
                description: scheduledCourse.description || "Description non disponible",
              },
              type: 'PROGRAMMED_COURSE'
            };
          }
        })
      );

      // Filter: only courses explicitly linked to this class
      const finalCourses = enrichedCourses.filter(c =>
        c.classeId === selectedClass.id ||
        (c.classesIds && c.classesIds.includes(selectedClass.id))
      );

      setScheduledCourses(finalCourses);
      resolveClassNames(finalCourses);
      
      // Auto-switch tab if no programmed courses but general courses exist
      if (finalCourses.length === 0 && generalCourses?.length > 0) {
        setActiveTab("ALL_COURSES");
      } else if (finalCourses.length === 0 && generalCourses?.length === 0 && exerciseProgrammerData?.length > 0) {
        setActiveTab("EXERCISES");
      }
      
      setFilteredCourses(finalCourses);
      
    } catch (error) {
      console.error("Error fetching class courses:", error);
      setError(`Erreur lors du chargement des cours: ${error.message}`);
      setScheduledCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses for the user (when no specific class is selected)
  const fetchAllUserCourses = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching all courses for user:", userId);

      // Import services
      const { coursProgrammerService } = await import(
        "../../../../../services/coursProgrammerService"
      );
      const { coursService } = await import(
        "../../../../../services/CoursService"
      );

      // Get all courses that the current user can access (by class or participant)
      const userCourses =
        await coursProgrammerService.obtenirProgrammationAccessible(userId);

      console.log("All accessible courses for user:", userCourses);

      // Enrich the scheduled courses with full course details
      const enrichedCourses = await Promise.all(
        (userCourses || []).map(async (scheduledCourse) => {
          try {
            // Get full course details if coursId exists
            if (scheduledCourse.coursId) {
              const fullCourseDetails = await coursService.getCoursById(
                scheduledCourse.coursId
              );
              return {
                ...scheduledCourse,
                cours: fullCourseDetails, // Add full course details
              };
            } else {
              // If no coursId, keep the original structure but ensure cours field exists
              return {
                ...scheduledCourse,
                cours: scheduledCourse.cours || {
                  titre: scheduledCourse.titre || "Cours sans titre",
                  description: scheduledCourse.description || "Description non disponible",
                },
              };
            }
          } catch (courseError) {
            console.warn(
              `Could not load course details for ${scheduledCourse.coursId}:`,
              courseError
            );
            // Return with minimal course info if loading fails
            return {
              ...scheduledCourse,
              cours: {
                id: scheduledCourse.coursId,
                titre:
                  scheduledCourse.titre ||
                  (scheduledCourse.coursId ? `Cours ${scheduledCourse.coursId.substring(0, 8)}` : "Cours non identifié"),
                description:
                  scheduledCourse.description || "Description non disponible",
              },
            };
          }
        })
      );

      console.log("All enriched courses count:", enrichedCourses.length);
      setScheduledCourses(enrichedCourses);
      setFilteredCourses(enrichedCourses);
      resolveClassNames(enrichedCourses);
    } catch (error) {
      console.error("Error fetching all user courses:", error);
      setError(`Erreur lors du chargement des cours: ${error.message}`);
      setScheduledCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search and status
  useEffect(() => {
    let filtered = scheduledCourses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.cours?.titre
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.cours?.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.lieu?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "TOUS") {
      filtered = filtered.filter(
        (course) => course.etatCoursProgramme === statusFilter
      );
    }

    setFilteredCourses(filtered);
    setPageProgrammed(1);
  }, [searchTerm, statusFilter, scheduledCourses]);

  // Reset other tab pages on search change
  useEffect(() => { setPageAllCourses(1); }, [searchTerm]);
  useEffect(() => { setPageExercises(1); }, [searchTerm]);
  useEffect(() => { setPageProgrammed(1); setPageAllCourses(1); setPageExercises(1); }, [activeTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PLANIFIE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EN_COURS":
        return "bg-green-100 text-green-800 border-green-200";
      case "TERMINE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ANNULE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PLANIFIE":
        return <Clock className="w-3 h-3" />;
      case "EN_COURS":
        return <PlayCircle className="w-3 h-3" />;
      case "TERMINE":
        return <CheckCircle className="w-3 h-3" />;
      case "ANNULE":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PLANIFIE":
        return "Planifié";
      case "EN_COURS":
        return "En cours";
      case "TERMINE":
        return "Terminé";
      case "ANNULE":
        return "Annulé";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Heure non définie";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBackToClasses = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    }
    setScheduledCourses([]);
    setFilteredCourses([]);
    setShowCourseDetail(false);
    setSelectedCourse(null);
    setError("");
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  const handleBackToCoursesList = () => {
    setShowCourseDetail(false);
    setSelectedCourse(null);
  };

  // Show course details if a course is selected
  if (showCourseDetail && selectedCourse) {
    return (
      <CourseDetailsView 
        courseId={selectedCourse.coursId || selectedCourse.id}
        onBack={handleBackToCoursesList}
      />
    );
  }

  // Main courses list view
  return (
    <div className="w-full px-2 py-3">
        {/* Header */}
        <div className="bg-white rounded-xl shadow mb-3 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white pb-0">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={handleBackToClasses}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base font-bold flex items-center truncate">
                      <GraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{selectedClass?.nom || "Gestion des Cours"}</span>
                    </h1>
                    {onScheduleCourse && (
                      <button
                        onClick={onScheduleCourse}
                        className="px-3 py-1 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Programmer
                      </button>
                    )}
                  </div>
                  <p className="text-blue-100 text-xs truncate">
                    {selectedClass ? `${selectedClass.niveau} - ${selectedClass.description || "Espace de classe"}` : 'Tous mes cours'}
                  </p>
                </div>
              </div>
              <span className="text-blue-100 text-xs flex-shrink-0 hidden sm:block">
                {filteredCourses.length} cours
              </span>
            </div>

            {/* Sub-tabs for Class View */}
            {selectedClass && (
              <div className="flex space-x-8 mt-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("PROGRAMMED")}
                  className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                    activeTab === "PROGRAMMED" ? "text-white" : "text-blue-200 hover:text-white"
                  }`}
                >
                  <span>Plannings</span>
                  {activeTab === "PROGRAMMED" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("ALL_COURSES")}
                  className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                    activeTab === "ALL_COURSES" ? "text-white" : "text-blue-200 hover:text-white"
                  }`}
                >
                  <span>Tous les Cours</span>
                  {activeTab === "ALL_COURSES" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("EXERCISES")}
                  className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                    activeTab === "EXERCISES" ? "text-white" : "text-blue-200 hover:text-white"
                  }`}
                >
                  <span>Exercices & Devoirs</span>
                  {activeTab === "EXERCISES" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="px-3 py-2 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value="PLANIFIE">Planifiés</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminés</option>
                  <option value="ANNULE">Annulés</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex items-center space-x-3">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">
                Chargement des cours...
              </span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "PROGRAMMED" ? (
              (() => {
                const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
                const safePage = Math.min(pageProgrammed, totalPages);
                const paged = filteredCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                return filteredCourses.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      {scheduledCourses.length === 0 ? "Aucun cours programmé" : "Aucun cours trouvé"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {scheduledCourses.length === 0
                        ? "Il n'y a actuellement aucun cours programmé pour cette classe."
                        : "Aucun cours ne correspond à vos critères de recherche."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {paged.map((course) => {
                        const cId = course.cours?.id || course.coursId;
                        const activeSession = activeSessions[cId];
                        const isLive = !!activeSession;
                        return (
                          <div key={course.id} className={`bg-white rounded-xl shadow-lg transition-all duration-300 border-2 overflow-hidden ${isLive ? 'border-green-400 shadow-green-100' : 'border-gray-100 hover:shadow-xl'}`}>
                            {isLive && (
                              <div className="bg-green-500 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                  <span className="text-white text-xs font-bold uppercase tracking-widest">Session en direct</span>
                                </div>
                                <span className="text-green-100 text-xs">{activeSession?.mode === 'VIDEO' ? '📹 Vidéo' : activeSession?.mode === 'AUDIO' ? '🎤 Audio' : '📚 Contenu'}</span>
                              </div>
                            )}
                            <div onClick={() => handleCourseClick(course)} className="p-3 sm:p-4 cursor-pointer">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h3 className="font-bold text-base text-gray-900 break-words">{course.cours?.titre || course.titre || 'Titre non disponible'}</h3>
                                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(course.etatCoursProgramme)}`}>
                                      <div className="flex items-center gap-1">{getStatusIcon(course.etatCoursProgramme)}<span>{getStatusText(course.etatCoursProgramme)}</span></div>
                                    </div>
                                  </div>
                                  <p className="text-gray-500 text-xs line-clamp-2">{course.cours?.description || 'Description non disponible'}</p>
                                  {getCoursClassName(course) && (
                                    <p className="text-indigo-600 text-xs font-medium mt-1 flex items-center gap-1">
                                      <GraduationCap className="w-3 h-3" />{getCoursClassName(course)}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(course.dateCoursPrevue)}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(course.dateCoursPrevue)}</span>
                                {course.lieu && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{course.lieu}</span>}
                              </div>
                            </div>
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                              {isLive ? (
                                <button onClick={() => setLiveSession({ scheduledCourse: course, cours: course.cours, isModerator: false })} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors shadow">
                                  <Radio className="w-4 h-4 animate-pulse" />Rejoindre la session en direct
                                </button>
                              ) : course.etatCoursProgramme === 'TERMINE' ? (
                                <button onClick={() => handleCourseClick(course)} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors">
                                  <Eye className="w-4 h-4" />Voir le contenu du cours
                                </button>
                              ) : course.etatCoursProgramme === 'ANNULE' ? (
                                <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-xl"><AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /><span className="text-xs text-red-500 font-medium">Ce cours a été annulé</span></div>
                              ) : course.etatCoursProgramme === 'PLANIFIE' ? (
                                <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-xl"><Clock className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="text-xs text-blue-600 font-medium">En attente du démarrage par le professeur</span></div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Pagination total={filteredCourses.length} page={safePage} totalPages={totalPages} onPage={setPageProgrammed} />
                  </>
                );
              })()
            ) : activeTab === "ALL_COURSES" ? (
              (() => {
                const filtered = classAllCourses.filter(c =>
                  !searchTerm ||
                  c.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                const safePage = Math.min(pageAllCourses, totalPages);
                const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">Aucun document trouvé</h3>
                    <p className="text-sm text-gray-600">Il n'y a pas encore de cours partagés dans cette classe.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paged.map((course) => (
                        <div key={course.id} onClick={() => handleCourseClick(course)} className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 p-4 flex flex-col">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 text-blue-600"><BookOpen className="w-5 h-5" /></div>
                          <h3 className="font-bold text-gray-900 mb-1 text-sm line-clamp-2">{course.titre}</h3>
                          <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">{course.description || "Aucune description disponible"}</p>
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(course.dateCreation).toLocaleDateString()}</span>
                            <span className="text-blue-600 text-xs font-medium flex items-center">Ouvrir <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination total={filtered.length} page={safePage} totalPages={totalPages} onPage={setPageAllCourses} />
                  </>
                );
              })()
            ) : (
              (() => {
                const filtered = classExercises.filter(e =>
                  !searchTerm ||
                  e.exercise?.titre?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                const safePage = Math.min(pageExercises, totalPages);
                const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">Aucun exercice</h3>
                    <p className="text-sm text-gray-600">Aucun exercice ou devoir n'a été programmé pour cette classe.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {paged.map((exo) => (
                        <div key={exo.id} className="bg-white rounded-xl shadow p-4 border-l-4 border-indigo-500 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-sm">{exo.exercise?.titre || "Sans titre"}</h3>
                              <div className="flex items-center text-xs text-gray-500 mt-0.5"><Calendar className="w-3 h-3 mr-1" /><span>Prévu le {new Date(exo.dateExoPrevue).toLocaleDateString()}</span></div>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-bold ${exo.etat === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{exo.etat}</div>
                          </div>
                          <p className="text-gray-500 text-xs mb-3 line-clamp-2">{exo.exercise?.description || "Consigne de l'exercice..."}</p>
                          <button className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors">Accéder à l'exercice</button>
                        </div>
                      ))}
                    </div>
                    <Pagination total={filtered.length} page={safePage} totalPages={totalPages} onPage={setPageExercises} />
                  </>
                );
              })()
            )}
          </>
        )}

        {/* Statistics Card */}
        {filteredCourses.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-indigo-600" />
              Statistiques des cours
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600 mb-0.5">
                  {scheduledCourses.filter(c => c.etatCoursProgramme === "PLANIFIE").length}
                </div>
                <div className="text-xs text-gray-600">Planifiés</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600 mb-0.5">
                  {scheduledCourses.filter(c => c.etatCoursProgramme === "EN_COURS").length}
                </div>
                <div className="text-xs text-gray-600">En cours</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-600 mb-0.5">
                  {scheduledCourses.filter(c => c.etatCoursProgramme === "TERMINE").length}
                </div>
                <div className="text-xs text-gray-600">Terminés</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600 mb-0.5">
                  {scheduledCourses.length}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-10 right-10 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Live Session */}
      {liveSession && (
        <LiveSession
          scheduledCourse={liveSession.scheduledCourse}
          cours={liveSession.cours}
          isModerator={false}
          onClose={() => setLiveSession(null)}
        />
      )}
    </div>
  );
};

export default CoursProgrammeManagement;