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
  Play,
  Pause,
  Loader,
} from "lucide-react";

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

  // Fetch courses for the selected class when component mounts
  useEffect(() => {
    if (selectedClass) {
      fetchCoursesForClass();
    }
  }, [selectedClass]);

  const fetchCoursesForClass = async () => {
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

  const fetchCourseResources = async (courseId) => {
    try {
      setResourcesLoading(true);

      // Import services - using correct paths based on your working component
      const { coursService } = await import(
        "../../../../../services/coursService"
      );
      const { minioS3Service } = await import(
        "../../../../../services/minioS3Service"
      );

      // Get course details with chapters/resources
      const courseDetails = await coursService.getCoursWithChapitres(courseId);

      // Get user media files related to this course
      const userMedia = await minioS3Service.getUserMedia(userId);

      // Filter media that might be related to this course
      // You can customize this logic based on your file naming conventions
      const courseRelatedMedia = userMedia.filter(
        (media) =>
          media.fileName
            .toLowerCase()
            .includes(courseDetails.titre.toLowerCase()) ||
          media.documentType === "course-materials"
      );

      setCourseResources(courseRelatedMedia);
    } catch (error) {
      console.error("Error fetching course resources:", error);
      setCourseResources([]);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleDownloadResource = async (resource) => {
    try {
      const { minioS3Service } = await import(
        "../../../../../services/minioS3Service"
      );

      if (resource.filePath) {
        await minioS3Service.downloadFileByPath(resource.filePath);
      } else {
        await minioS3Service.downloadFile(resource.id);
      }
    } catch (error) {
      console.error("Error downloading resource:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    } else if (contentType?.startsWith("video/")) {
      return <Video className="w-4 h-4" />;
    } else {
      return <FileIcon className="w-4 h-4" />;
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

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
    // Fetch resources for this course
    if (course.cours?.id) {
      fetchCourseResources(course.cours.id);
    }
  };

  const handleBackToCourses = () => {
    setShowCourseDetail(false);
    setSelectedCourse(null);
    setCourseResources([]);
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

  // Course Detail View
  if (showCourseDetail && selectedCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToCourses}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center">
                      <BookOpen className="w-6 h-6 mr-3" />
                      Détails du cours
                    </h1>
                    <p className="text-blue-100 mt-1">{selectedClass?.nom}</p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border ${getStatusColor(
                    selectedCourse.etatCoursProgramme
                  )} bg-white/20 text-white border-white/30`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedCourse.etatCoursProgramme)}
                    <span className="font-medium">
                      {getStatusText(selectedCourse.etatCoursProgramme)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Info Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedCourse.cours?.titre || "Titre non disponible"}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {selectedCourse.cours?.description ||
                        "Description non disponible"}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      <Book className="w-4 h-4" />
                      <span>
                        {selectedCourse.cours?.matieres?.[0]?.nom ||
                          "Matière non définie"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Notes du cours
                    </h3>
                    <p className="text-gray-700">
                      {selectedCourse.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Resources Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Ressources du cours
                  {resourcesLoading && (
                    <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  )}
                </h3>

                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">
                      Chargement des ressources...
                    </span>
                  </div>
                ) : courseResources.length > 0 ? (
                  <div className="space-y-3">
                    {courseResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(resource.contentType)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {resource.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {resource.mediaType} •{" "}
                              {Math.round(resource.fileSize / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadResource(resource)}
                          className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Télécharger</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Aucune ressource disponible pour ce cours
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Planning du cours
                </h3>

                <div className="space-y-4">
                  {/* Planned Date */}
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Date prévue</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedCourse.dateCoursPrevue)} à{" "}
                        {formatTime(selectedCourse.dateCoursPrevue)}
                      </p>
                    </div>
                  </div>

                  {/* Actual Dates */}
                  {selectedCourse.dateDebutEffectif && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <PlayCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Début effectif
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(selectedCourse.dateDebutEffectif)} à{" "}
                            {formatTime(selectedCourse.dateDebutEffectif)}
                          </p>
                        </div>
                      </div>

                      {selectedCourse.dateFinEffectif && (
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Fin effective
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(selectedCourse.dateFinEffectif)} à{" "}
                              {formatTime(selectedCourse.dateFinEffectif)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Lieu
                </h3>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-gray-900">
                    {selectedCourse.lieu || "Lieu non défini"}
                  </span>
                </div>
              </div>

              {/* Participants Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" />
                  Participants
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-gray-700">
                        Participants inscrits
                      </span>
                    </div>
                    <span className="font-bold text-indigo-600">
                      {selectedCourse.participantsIds?.length || 0}
                    </span>
                  </div>
                  {selectedCourse.capaciteMax && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-gray-700">
                          Capacité maximale
                        </span>
                      </div>
                      <span className="font-bold text-indigo-600">
                        {selectedCourse.capaciteMax}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  {selectedCourse.etatCoursProgramme === "EN_COURS" && (
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>Rejoindre le cours</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      fetchCourseResources(selectedCourse.cours?.id)
                    }
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Actualiser les ressources</span>
                  </button>

                  <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Exercices</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No class selected state
  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center">
                    <GraduationCap className="w-8 h-8 mr-4" />
                    Mes Cours Programmés
                  </h1>
                  <p className="text-indigo-100 mt-2 text-lg">
                    Aucune classe sélectionnée
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune classe sélectionnée
            </h3>
            <p className="text-gray-600">
              Veuillez sélectionner une classe pour voir les cours programmés.
            </p>
          </div>
        </div>
      </div>
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
                    {selectedClass.nom} - {selectedClass.niveau}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">
                  {filteredCourses.length} cours
                </p>
                <p className="font-semibold">
                  {selectedClass.effectif || 0} élèves
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
                    ? "Il n'y a actuellement aucun cours programmé pour cette classe."
                    : "Aucun cours ne correspond à vos critères de recherche."}
                </p>
                {scheduledCourses.length === 0 && (
                  <button
                    onClick={fetchCoursesForClass}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Actualiser
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                    onClick={() => handleCourseSelect(course)}
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

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCourseSelect(course);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir détails</span>
                            </button>

                            {course.etatCoursProgramme === "EN_COURS" && (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1"
                              >
                                <Video className="w-3 h-3" />
                                <span>Rejoindre</span>
                              </button>
                            )}

                            {course.etatCoursProgramme === "PLANIFIE" && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                À venir
                              </span>
                            )}
                          </div>
                        </div>
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
