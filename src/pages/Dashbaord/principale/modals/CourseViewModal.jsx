import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Users,
  BookOpen,
  MapPin,
  Calendar,
  FileText,
  Search,
  Filter,
  ChevronDown,
  Download,
  Eye,
  Grid,
  List,
  User,
  Mail,
  Phone,
  School,
  ChevronRight,
  Clock,
  Edit2,
  Share2,
  Archive,
  Star,
  CheckCircle,
  XCircle,
  Activity,
  Timer,
  UserCheck,
  PlayCircle,
  CalendarPlus,
} from "lucide-react";
import { minioS3Service } from "../../../../services/minioS3";

const CourseViewModal = ({ classe, onClose, onSuccess, onEdit, theme }) => {
  // Handle the course data (passed as classe prop)
  const course = classe;

  const [courseDocuments, setCourseDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [documentViewMode, setDocumentViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("details");
  const [participants, setParticipants] = useState([]);
  const [processedChapters, setProcessedChapters] = useState([]);

  // Move all useEffect hooks before any conditional logic
  useEffect(() => {
    if (course) {
      fetchCourseData();
    }
  }, [course]);

  useEffect(() => {
    filterDocuments();
  }, [documentSearchTerm, documentFilter, courseDocuments]);

  useEffect(() => {
    if (course && course.chapitres) {
      processChapterContent();
    }
  }, [course]);

  // Early return after all hooks have been declared
  if (!course) {
    return null;
  }

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);

      // Fetch documents - placeholder for now
      const documents = [];
      setCourseDocuments(documents);
      setFilteredDocuments(documents);

      // Handle participants if available
      if (course.participants && course.participants.length > 0) {
        setParticipants(course.participants);
      } else if (course.eleves && course.eleves.length > 0) {
        setParticipants(course.eleves);
      }
    } catch (err) {
      console.error("Failed to load course data:", err);
      setError("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  };

  const processChapterContent = async () => {
    if (!course.chapitres) return;

    try {
      const processedChaps = await Promise.all(
        course.chapitres.map(async (chapter) => {
          let processedContent = chapter.contenu || "";

          // Find all MinIO file paths in the content
          const minioPathRegex =
            /(?:https?:\/\/[^\/\s]+\/)?(images|videos|documents)\/[^"\s<>]+\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt)/g;
          let match;
          const pathsToProcess = [];

          while ((match = minioPathRegex.exec(processedContent)) !== null) {
            pathsToProcess.push(match[0]);
          }

          // Process each path to generate download URLs
          for (const path of pathsToProcess) {
            try {
              // Clean the path to get just the relative path
              const cleanPath = path.replace(/^https?:\/\/[^\/]+\//, "");

              const downloadData =
                await minioS3Service.generateDownloadUrlByPath(cleanPath);

              if (downloadData && downloadData.downloadUrl) {
                // Replace the path with the signed URL
                processedContent = processedContent.replace(
                  new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
                  downloadData.downloadUrl
                );
              }
            } catch (error) {
              console.warn(
                `Failed to generate download URL for ${path}:`,
                error
              );
            }
          }

          return {
            ...chapter,
            processedContent,
          };
        })
      );

      setProcessedChapters(processedChaps);
    } catch (error) {
      console.error("Error processing chapter content:", error);
      setProcessedChapters(course.chapitres || []);
    }
  };

  const filterDocuments = () => {
    let filtered = courseDocuments;

    if (documentSearchTerm) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(documentSearchTerm.toLowerCase())
      );
    }

    if (documentFilter !== "all") {
      filtered = filtered.filter((doc) => doc.type === documentFilter);
    }

    setFilteredDocuments(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      BROUILLON: {
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        text: "Brouillon",
      },
      EN_ATTENTE_VALIDATION: {
        className: "bg-blue-50 text-blue-700 border-blue-200",
        text: "En attente",
      },
      PUBLIE: {
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "Publié",
      },
      ARCHIVE: {
        className: "bg-red-50 text-red-700 border-red-200",
        text: "Archivé",
      },
      default: {
        className: "bg-slate-50 text-slate-700 border-slate-200",
        text: status || "Non défini",
      },
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full mr-2 ${
            status === "PUBLIE"
              ? "bg-emerald-500"
              : status === "BROUILLON"
              ? "bg-yellow-500"
              : status === "EN_ATTENTE_VALIDATION"
              ? "bg-blue-500"
              : "bg-red-500"
          }`}
        ></div>
        {config.text}
      </span>
    );
  };

  const getDocumentTypeBadge = (type) => {
    const typeConfig = {
      identity: {
        className: "bg-blue-50 text-blue-700 border-blue-200",
        text: "Identité",
      },
      profile: {
        className: "bg-purple-50 text-purple-700 border-purple-200",
        text: "Profil",
      },
      academic: {
        className: "bg-green-50 text-green-700 border-green-200",
        text: "Académique",
      },
    };

    const config = typeConfig[type] || {
      className: "bg-slate-50 text-slate-700 border-slate-200",
      text: "Autre",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.className}`}
      >
        {type === "identity" ? (
          <User className="w-4 h-4 mr-1" />
        ) : type === "profile" ? (
          <User className="w-4 h-4 mr-1" />
        ) : (
          <FileText className="w-4 h-4 mr-1" />
        )}
        {config.text}
      </span>
    );
  };

  const handleDocumentView = (document) => {
    window.open(document.url, "_blank");
  };

  const handleDocumentDownload = (document) => {
    const link = document.createElement("a");
    link.href = document.url;
    link.download = `${document.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const words = name.split(" ");
    return words
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const renderChapterContent = (content) => {
    if (!content) return null;

    // Convert newlines to <br> tags for display
    const formattedContent = content.replace(/\n/g, "<br>");

    return (
      <div
        className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
        style={{
          wordBreak: "break-word",
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Détails du Cours
                </h2>
                <p className="text-slate-600 mt-1">{course?.titre}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {getStatusBadge(course?.etat)}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-8">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Détails
            </button>
            {(processedChapters.length > 0 ||
              (course?.chapitres && course.chapitres.length > 0)) && (
              <button
                onClick={() => setActiveTab("chapters")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "chapters"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                Chapitres (
                {processedChapters.length || course?.chapitres?.length || 0})
              </button>
            )}
            {participants.length > 0 && (
              <button
                onClick={() => setActiveTab("participants")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "participants"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                Participants ({participants.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "documents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Documents ({courseDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-8">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-8">
                {/* Course Information */}
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                    Informations du Cours
                  </h3>

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Course Avatar and basic info */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                            <span className="text-white font-bold text-2xl">
                              {getInitials(course?.titre)}
                            </span>
                          </div>
                          <div className="absolute -bottom-2 -right-2">
                            <div
                              className={`w-6 h-6 rounded-full border-4 border-white ${
                                course?.etat === "PUBLIE"
                                  ? "bg-emerald-500"
                                  : course?.etat === "BROUILLON"
                                  ? "bg-yellow-500"
                                  : course?.etat === "EN_ATTENTE_VALIDATION"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {course?.titre}
                          </div>
                          <div className="text-slate-600 font-medium mt-1">
                            {course?.matiere?.nom || "Matière non définie"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Details Grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Date de début
                              </p>
                              <p className="text-slate-900">
                                {formatDate(course?.dateHeureDebut)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <Clock className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Date de fin
                              </p>
                              <p className="text-slate-900">
                                {formatDate(course?.dateHeureFin)}
                              </p>
                            </div>
                          </div>

                          {course?.dateCreation && (
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <CalendarPlus className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 font-medium">
                                  Date de création
                                </p>
                                <p className="text-slate-900">
                                  {formatDate(course.dateCreation)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                              <MapPin className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Lieu
                              </p>
                              <p className="text-slate-900">
                                {course?.lieu || "Non spécifié"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                              <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">
                                Professeur
                              </p>
                              <p className="text-slate-900">
                                {course?.redacteur?.nom ||
                                course?.redacteur?.prenom
                                  ? `${course.redacteur.prenom || ""} ${
                                      course.redacteur.nom || ""
                                    }`.trim()
                                  : "Non spécifié"}
                              </p>
                            </div>
                          </div>

                          {course?.duree && (
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-rose-50 rounded-lg">
                                <Timer className="w-4 h-4 text-rose-600" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 font-medium">
                                  Durée
                                </p>
                                <p className="text-slate-900">
                                  {course.duree} minutes
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {course?.description && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Description
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  )}

                  {course?.contenu && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                        Contenu du cours
                      </h4>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {course.contenu}
                        </p>
                      </div>
                    </div>
                  )}

                  {course?.references && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Références
                      </h4>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {course.references}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subject Information */}
                  {(course?.matiere ||
                    (course?.matieres && course.matieres.length > 0)) && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <School className="w-5 h-5 mr-2 text-indigo-600" />
                        {course?.matieres && course.matieres.length > 1
                          ? "Matières Associées"
                          : "Matière Associée"}
                      </h4>

                      {course?.matiere ? (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-slate-900">
                                {course.matiere.nom}
                              </h5>
                              {course.matiere.description && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {course.matiere.description}
                                </p>
                              )}
                              {course.matiere.coefficient && (
                                <div className="mt-2">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    Coefficient: {course.matiere.coefficient}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                course.matiere.etat === "ACTIF"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {course.matiere.etat}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {course.matieres.map((matiere, index) => (
                            <div
                              key={matiere.id || index}
                              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-slate-900">
                                    {matiere.nom}
                                  </h5>
                                  {matiere.description && (
                                    <p className="text-sm text-slate-600 mt-1">
                                      {matiere.description}
                                    </p>
                                  )}
                                  {matiere.coefficient && (
                                    <div className="mt-2">
                                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        Coefficient: {matiere.coefficient}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    matiere.etat === "ACTIF"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {matiere.etat || "ACTIF"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chapters Tab */}
            {activeTab === "chapters" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                    Chapitres du Cours (
                    {processedChapters.length || course?.chapitres?.length || 0}
                    )
                  </h3>
                </div>

                {(!processedChapters || processedChapters.length === 0) &&
                (!course?.chapitres || course.chapitres.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun chapitre disponible
                    </h4>
                    <p className="text-slate-600">
                      Ce cours ne contient pas encore de chapitres.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(processedChapters.length > 0
                      ? processedChapters
                      : course.chapitres
                    ).map((chapter, index) => (
                      <div
                        key={chapter.id || index}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                {chapter.ordre || index + 1}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {chapter.titre}
                                </h4>
                                {chapter.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-6">
                          {chapter.processedContent ? (
                            renderChapterContent(chapter.processedContent)
                          ) : chapter.contenu ? (
                            renderChapterContent(chapter.contenu)
                          ) : (
                            <div className="text-slate-500 italic">
                              Aucun contenu disponible pour ce chapitre.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    Participants ({participants.length})
                  </h3>
                </div>

                {participants.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun participant inscrit
                    </h4>
                    <p className="text-slate-600">
                      Les étudiants pourront s'inscrire à ce cours.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {participants.map((participant, index) => (
                      <div
                        key={participant.id || index}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-medium">
                                {participant.prenom?.charAt(0) || "U"}
                                {participant.nom?.charAt(0) || ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900">
                              {participant.prenom} {participant.nom}
                            </h4>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                              {participant.email && (
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                  <span className="truncate">
                                    {participant.email}
                                  </span>
                                </div>
                              )}
                              {participant.telephone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                  <span>{participant.telephone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                participant.etat === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : participant.etat === "INACTIVE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {participant.etat === "ACTIVE"
                                ? "Actif"
                                : participant.etat === "INACTIVE"
                                ? "Inactif"
                                : participant.etat || "Statut inconnu"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                    Documents ({filteredDocuments.length})
                  </h3>

                  {/* Document Controls */}
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Rechercher documents..."
                        value={documentSearchTerm}
                        onChange={(e) => setDocumentSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                      />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setDocumentViewMode("grid")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          documentViewMode === "grid"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDocumentViewMode("list")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          documentViewMode === "list"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Documents Content */}
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Aucun document disponible
                    </h4>
                    <p className="text-slate-600">
                      Aucun document n'a été associé à ce cours.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Documents à venir
                    </h4>
                    <p className="text-slate-600">
                      La gestion des documents sera bientôt disponible.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Historique des Modifications
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          Cours créé
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Le cours a été créé avec succès
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {course?.dateCreation
                            ? formatDate(course.dateCreation)
                            : "Date de création non disponible"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {course?.dateHeureDebut && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Date de début programmée
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours est programmé pour commencer
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(course.dateHeureDebut)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.dateHeureFin && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Date de fin programmée
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours est programmé pour se terminer
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDate(course.dateHeureFin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.etat === "PUBLIE" && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours publié
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été publié et est maintenant accessible
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course?.etat === "ARCHIVE" && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Archive className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            Cours archivé
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            Le cours a été archivé
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              ID: {course?.id || "Non défini"}
            </div>

            <div className="flex items-center space-x-3">
              {/* Action buttons based on course state */}
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(course);
                    onClose();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              )}

              <button
                onClick={() => {
                  // Handle share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: course?.titre,
                      text: course?.description || "Cours partagé",
                      url: window.location.href,
                    });
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    alert("Lien copié dans le presse-papiers !");
                  }
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 transition-colors font-medium"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewModal;
