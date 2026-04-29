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

const CoursProgrammeManagement = ({ selectedClass, onBack, onScheduleCourse, userRole, tabData }) => {
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [classExercises, setClassExercises] = useState([]);
  const [classAllCourses, setClassAllCourses] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState("PROGRAMMED"); // PROGRAMMED, ALL_COURSES, EXERCISES
  const [loading, setLoading] = useState(false);

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
  }, [searchTerm, statusFilter, scheduledCourses]);

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
    <div>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white pb-0">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <button
                  onClick={handleBackToClasses}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h1 className="text-lg sm:text-2xl font-bold flex items-center truncate">
                      <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="truncate">{selectedClass?.nom || "Gestion des Cours"}</span>
                    </h1>
                    {onScheduleCourse && (
                    <button
                      onClick={onScheduleCourse}
                      className="px-3 sm:px-4 py-1.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2 text-xs sm:text-sm self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Programmer</span>
                    </button>
                    )}
                  </div>
                  <p className="text-blue-100 mt-1 text-sm truncate">
                    {selectedClass ? `${selectedClass.niveau} - ${selectedClass.description || "Espace de classe"}` : 'Tous mes cours'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-blue-100 text-sm">
                  {filteredCourses.length} cours programmés
                </p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                    {activeTab === 'PROGRAMMED' ? 'Cours Programmés' : activeTab === 'ALL_COURSES' ? 'Tous les Cours' : 'Exercices'}
                  </span>
                </div>
              </div>
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
          <div className="p-3 sm:p-6 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              filteredCourses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {scheduledCourses.length === 0
                      ? "Aucun cours programmé"
                      : "Aucun cours trouvé"}
                  </h3>
                  <p className="text-gray-600">
                    {scheduledCourses.length === 0
                      ? "Il n'y a actuellement aucun cours programmé pour cette classe."
                      : "Aucun cours ne correspond à vos critères de recherche."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {filteredCourses.map((course) => {
                    const cId = course.cours?.id || course.coursId;
                    const activeSession = activeSessions[cId];
                    const isLive = !!activeSession;
                    const isEnded = course.etatCoursProgramme === 'TERMINE';
                    const isPlanned = course.etatCoursProgramme === 'PLANIFIE';

                    return (
                    <div
                      key={course.id}
                      className={`bg-white rounded-xl shadow-lg transition-all duration-300 border-2 overflow-hidden ${
                        isLive ? 'border-green-400 shadow-green-100' : 'border-gray-100 hover:shadow-xl'
                      }`}
                    >
                      {/* LIVE banner */}
                      {isLive && (
                        <div className="bg-green-500 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Session en direct</span>
                          </div>
                          <span className="text-green-100 text-xs">{activeSession?.mode === 'VIDEO' ? '📹 Vidéo' : activeSession?.mode === 'AUDIO' ? '🎤 Audio' : '📚 Contenu'}</span>
                        </div>
                      )}

                      {/* Card body — click to view details */}
                      <div
                        onClick={() => handleCourseClick(course)}
                        className="p-4 sm:p-5 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-base text-gray-900 break-words">
                                {course.cours?.titre || course.titre || 'Titre non disponible'}
                              </h3>
                              <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(course.etatCoursProgramme)}`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(course.etatCoursProgramme)}
                                  <span>{getStatusText(course.etatCoursProgramme)}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-500 text-xs line-clamp-2">
                              {course.cours?.description || 'Description non disponible'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(course.dateCoursPrevue)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(course.dateCoursPrevue)}</span>
                          {course.lieu && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{course.lieu}</span>}
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                        {isLive ? (
                          <button
                            onClick={() => setLiveSession({ scheduledCourse: course, cours: course.cours, isModerator: false })}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors shadow"
                          >
                            <Radio className="w-4 h-4 animate-pulse" />
                            Rejoindre la session en direct
                          </button>
                        ) : course.etatCoursProgramme === 'TERMINE' ? (
                          <button
                            onClick={() => handleCourseClick(course)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Voir le contenu du cours
                          </button>
                        ) : course.etatCoursProgramme === 'ANNULE' ? (
                          <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-xs text-red-500 font-medium">Ce cours a été annulé</span>
                          </div>
                        ) : course.etatCoursProgramme === 'PLANIFIE' ? (
                          <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-xl">
                            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-blue-600 font-medium">En attente du démarrage par le professeur</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === "ALL_COURSES" ? (
              classAllCourses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun document trouvé
                  </h3>
                  <p className="text-gray-600">
                    Il n'y a pas encore de cours partagés dans cette classe.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classAllCourses.filter(c => 
                    !searchTerm || 
                    c.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 p-6 flex flex-col"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.titre}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 overflow-hidden flex-1">
                        {course.description || "Aucune description disponible"}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{new Date(course.dateCreation).toLocaleDateString()}</span>
                        </div>
                        <span className="text-blue-600 text-sm font-medium flex items-center">
                          Ouvrir <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // EXERCISES TAB
              classExercises.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun exercice
                  </h3>
                  <p className="text-gray-600">
                    Aucun exercice ou devoir n'a été programmé pour cette classe.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {classExercises.filter(e => 
                    !searchTerm || 
                    e.exercise?.titre?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((exo) => (
                    <div
                      key={exo.id}
                      className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{exo.exercise?.titre || "Sans titre"}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Prévu pour le {new Date(exo.dateExoPrevue).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${exo.etat === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {exo.etat}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {exo.exercise?.description || "Consigne de l'exercice..."}
                      </p>
                      <button className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors">
                        Accéder à l'exercice
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* Statistics Card */}
        {filteredCourses.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Statistiques des cours
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "PLANIFIE"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Planifiés</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "EN_COURS"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {
                    scheduledCourses.filter(
                      (c) => c.etatCoursProgramme === "TERMINE"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Terminés</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {scheduledCourses.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-10 right-10 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'} text-white animate-bounce-slow`}>
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