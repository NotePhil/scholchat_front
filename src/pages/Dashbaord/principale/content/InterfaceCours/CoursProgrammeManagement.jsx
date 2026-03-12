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
} from "lucide-react";
import CourseDetailsView from './CourseDetailsView';

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

  const userId = localStorage.getItem("userId");
  const isProfessorOrAdmin = userRole === 'professor' || userRole === 'admin' || userRole?.includes('PROFESSOR') || userRole?.includes('ADMIN');

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

      // Handle General Courses
      if (Array.isArray(generalCourses)) {
        setClassAllCourses(generalCourses.map(c => ({...c, type: 'COURSE'})));
      } else {
        setClassAllCourses([]);
      }

      // Merge and deduplicate scheduled courses
      const coursesMap = new Map();
      if (Array.isArray(participantCourses)) {
        participantCourses.forEach(c => coursesMap.set(c.id, c));
      }
      if (Array.isArray(classCoursesData)) {
        classCoursesData.forEach(c => {
          if (!coursesMap.has(c.id)) {
            coursesMap.set(c.id, c);
          }
        });
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

      // Filter final list for the selected class context
      const finalCourses = enrichedCourses.filter(c => 
        c.classeId === selectedClass.id || 
        (c.participantsIds && c.participantsIds.includes(userId))
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToClasses}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold flex items-center">
                      <GraduationCap className="w-7 h-7 mr-3" />
                      {selectedClass?.nom || "Gestion des Cours"}
                    </h1>
                    {onScheduleCourse && (
                    <button
                      onClick={onScheduleCourse}
                      className="px-4 py-1.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Programmer</span>
                    </button>
                    )}
                  </div>
                  <p className="text-blue-100 mt-1">
                    {selectedClass ? `${selectedClass.niveau} - ${selectedClass.description || "Espace de classe"}` : 'Tous mes cours'}
                  </p>
                </div>
              </div>
              <div className="text-right">
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
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">
                                {course.cours?.titre || "Titre non disponible"}
                              </h3>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  course.etatCoursProgramme
                                )}`}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(course.etatCoursProgramme)}
                                  <span>
                                    {getStatusText(course.etatCoursProgramme)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {course.cours?.description ||
                                "Description non disponible"}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0 ml-2" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(course.dateCoursPrevue)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(course.dateCoursPrevue)}</span>
                            </div>
                          </div>

                          {course.lieu && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">
                                {course.lieu}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};

export default CoursProgrammeManagement;