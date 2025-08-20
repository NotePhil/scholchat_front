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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("info");
  const [participants, setParticipants] = useState([]);

  // Move all useEffect hooks before any conditional logic
  useEffect(() => {
    if (course) {
      fetchCourseData();
    }
  }, [course]);

  useEffect(() => {
    filterDocuments();
  }, [documentSearchTerm, documentFilter, courseDocuments]);

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
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Détails du cours
                </h2>
                <p className="text-slate-600 mt-1">
                  Informations détaillées du cours
                </p>
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
              onClick={() => setActiveTab("info")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "info"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Informations
            </button>
            {participants.length > 0 && (
              <button
                onClick={() => setActiveTab("participants")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "participants"
                    ? "border-blue-500 text-blue-600"
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
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Documents ({courseDocuments.length})
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

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div
                  className="w-12 h-12 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                    clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {/* Course Info Tab */}
              {activeTab === "info" && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                      Informations du cours
                    </h3>

                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Course basic info */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl">
                              <span className="text-white font-bold text-2xl">
                                {course?.titre?.charAt(0) || "C"}
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

                      {/* Details grid */}
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
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <MapPin className="w-4 h-4 text-purple-600" />
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
                              <div className="p-2 bg-amber-50 rounded-lg">
                                <User className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 font-medium">
                                  Professeur
                                </p>
                                <p className="text-slate-900">
                                  {course?.redacteur?.nom || "Non spécifié"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Description */}
                    {course?.description && (
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          Description
                        </h4>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-slate-700 leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Course Content */}
                    {course?.contenu && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                          Contenu du cours
                        </h4>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {course.contenu}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-end space-x-4">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(course)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === "participants" && participants.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Participants ({participants.length})
                    </h3>
                  </div>

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
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
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
                          onChange={(e) =>
                            setDocumentSearchTerm(e.target.value)
                          }
                          className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        />
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => setDocumentViewMode("grid")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            documentViewMode === "grid"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDocumentViewMode("list")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            documentViewMode === "list"
                              ? "bg-white text-blue-600 shadow-sm"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewModal;
