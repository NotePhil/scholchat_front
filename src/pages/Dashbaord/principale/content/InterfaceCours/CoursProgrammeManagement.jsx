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
  Loader,
} from "lucide-react";
import CourseDetailsView from './CourseDetailsView';

const CoursProgrammeManagement = ({ selectedClass, onBack }) => {
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [courseResources, setCourseResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

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

      // Import services - using correct paths based on your working component
      const { coursProgrammerService } = await import(
        "../../../../../services/coursProgrammerService"
      );
      const { coursService } = await import(
        "../../../../../services/CoursService"
      );

      // Get all courses that the current user can access as a participant
      const userCourses =
        await coursProgrammerService.obtenirProgrammationParParticipant(userId);

      console.log("All user courses:", userCourses);

      // Enrich the scheduled courses with full course details
      const enrichedCourses = await Promise.all(
        userCourses.map(async (scheduledCourse) => {
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
                  titre: "Cours sans titre",
                  description: "Description non disponible",
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
                  `Cours ${scheduledCourse.coursId?.substring(0, 8)}` ||
                  "Cours non identifié",
                description:
                  scheduledCourse.description || "Description non disponible",
              },
            };
          }
        })
      );

      console.log("Enriched courses:", enrichedCourses);

      // Filter courses to show only those where:
      // 1. The user is in the participants list
      // 2. The course is associated with the selected class (if classeId exists)
      // 3. OR the course doesn't have a specific class but user has access through other means
      const classScheduledCourses = enrichedCourses.filter(
        (scheduledCourse) => {
          // Check if user is explicitly in participants
          const isParticipant =
            scheduledCourse.participantsIds &&
            scheduledCourse.participantsIds.includes(userId);

          // Check if course is for this class
          const isForThisClass = scheduledCourse.classeId === selectedClass.id;

          // If course has no specific class, check if user should have access based on class membership
          const hasGeneralAccess = !scheduledCourse.classeId && isParticipant;

          return isParticipant && (isForThisClass || hasGeneralAccess);
        }
      );

      console.log("Filtered courses for class:", classScheduledCourses);

      // If no courses found specifically for this class, try to get courses accessible to the user
      // that might be relevant to this class
      if (classScheduledCourses.length === 0) {
        console.log(
          "No courses found with classeId, trying accessible courses approach"
        );

        try {
          const accessibleCourses =
            await coursProgrammerService.obtenirProgrammationAccessible(userId);
          console.log("Accessible courses:", accessibleCourses);

          // Enrich accessible courses with full details too
          const enrichedAccessibleCourses = await Promise.all(
            accessibleCourses.map(async (scheduledCourse) => {
              try {
                if (scheduledCourse.coursId) {
                  const fullCourseDetails = await coursService.getCoursById(
                    scheduledCourse.coursId
                  );
                  return {
                    ...scheduledCourse,
                    cours: fullCourseDetails,
                  };
                } else {
                  return {
                    ...scheduledCourse,
                    cours: scheduledCourse.cours || {
                      titre: "Cours sans titre",
                      description: "Description non disponible",
                    },
                  };
                }
              } catch (error) {
                console.warn(`Could not enrich accessible course:`, error);
                return {
                  ...scheduledCourse,
                  cours: {
                    id: scheduledCourse.coursId,
                    titre: scheduledCourse.titre || "Cours accessible",
                    description:
                      scheduledCourse.description ||
                      "Description non disponible",
                  },
                };
              }
            })
          );

          setScheduledCourses(enrichedAccessibleCourses);
          setFilteredCourses(enrichedAccessibleCourses);
        } catch (accessError) {
          console.error("Error fetching accessible courses:", accessError);
          setScheduledCourses(classScheduledCourses);
          setFilteredCourses(classScheduledCourses);
        }
      } else {
        setScheduledCourses(classScheduledCourses);
        setFilteredCourses(classScheduledCourses);
      }

      console.log(
        "Final courses set:",
        classScheduledCourses.length > 0
          ? classScheduledCourses
          : "accessible courses"
      );
    } catch (error) {
      console.error("Error fetching courses:", error);
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

      // Get all courses that the current user can access as a participant
      const userCourses =
        await coursProgrammerService.obtenirProgrammationParParticipant(userId);

      console.log("All user courses:", userCourses);

      // Enrich the scheduled courses with full course details
      const enrichedCourses = await Promise.all(
        userCourses.map(async (scheduledCourse) => {
          try {
            // Get full course details if coursId exists
            if (scheduledCourse.coursId) {
              const fullCourseDetails = await coursService.getCoursById(
                scheduledCourse.coursId
              );
              return {
                ...scheduledCourse,
                cours: fullCourseDetails,
              };
            } else {
              return {
                ...scheduledCourse,
                cours: scheduledCourse.cours || {
                  titre: "Cours sans titre",
                  description: "Description non disponible",
                },
              };
            }
          } catch (courseError) {
            console.warn(
              `Could not load course details for ${scheduledCourse.coursId}:`,
              courseError
            );
            return {
              ...scheduledCourse,
              cours: {
                id: scheduledCourse.coursId,
                titre:
                  scheduledCourse.titre ||
                  `Cours ${scheduledCourse.coursId?.substring(0, 8)}` ||
                  "Cours non identifié",
                description:
                  scheduledCourse.description || "Description non disponible",
              },
            };
          }
        })
      );

      console.log("All enriched courses:", enrichedCourses);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToClasses}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <Calendar className="w-6 h-6 mr-3" />
                    Cours Programmés
                  </h1>
                  <p className="text-blue-100 mt-1">
                    {selectedClass ? `${selectedClass.nom} - ${selectedClass.niveau}` : 'Tous mes cours'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">
                  {filteredCourses.length} cours
                </p>
                <p className="font-semibold">
                  {selectedClass ? `${selectedClass.effectif || 0} élèves` : `${filteredCourses.reduce((total, course) => total + (course.participantsIds?.length || 0), 0)} participants`}
                </p>
              </div>
            </div>
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
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {scheduledCourses.length === 0
                    ? "Aucun cours programmé"
                    : "Aucun cours trouvé"}
                </h3>
                <p className="text-gray-600">
                  {scheduledCourses.length === 0
                    ? "Il n'y a actuellement aucun cours programmé."
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

                        {course.participantsIds &&
                          course.participantsIds.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">
                                {course.participantsIds.length} participant
                                {course.participantsIds.length > 1 ? "s" : ""}
                                {course.capaciteMax &&
                                  ` / ${course.capaciteMax}`}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
};

export default CoursProgrammeManagement;