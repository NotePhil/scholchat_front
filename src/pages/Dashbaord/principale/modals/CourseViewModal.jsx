import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Users,
  BookOpen,
  Star,
  Play,
  Download,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Award,
  CheckCircle,
  FileText,
  Video,
  Image,
  AlertCircle,
  Globe,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
// import { coursService } from "../../../../services/CoursService";

const CourseViewModal = ({
  course,
  onClose,
  onSuccess,
  onEdit,
  theme = "light",
}) => {
  const [currentTab, setCurrentTab] = useState("overview");
  const [courseDetails, setCourseDetails] = useState(course);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [scheduledCourses, setScheduledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getThemeStyles = () => {
    switch (theme) {
      case "dark":
        return {
          background: "bg-gray-900",
          cardBg: "bg-gray-800/80",
          textColor: "text-gray-200",
          titleColor: "text-white",
          borderColor: "border-gray-700",
          hoverBorder: "border-gray-600",
          buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
          buttonDanger: "bg-red-600 hover:bg-red-700 text-white",
          tabActive: "bg-blue-600 text-white",
          tabInactive: "bg-gray-700 text-gray-300 hover:bg-gray-600",
          stateBadge: {
            BROUILLON: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
            PUBLIE: "bg-green-900/50 text-green-300 border-green-700",
            ARCHIVE: "bg-gray-900/50 text-gray-400 border-gray-700",
            EN_ATTENTE_VALIDATION:
              "bg-orange-900/50 text-orange-300 border-orange-700",
          },
        };
      case "light":
        return {
          background: "bg-gray-50",
          cardBg: "bg-white/90",
          textColor: "text-gray-700",
          titleColor: "text-gray-900",
          borderColor: "border-gray-200",
          hoverBorder: "border-gray-300",
          buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-700",
          buttonDanger: "bg-red-600 hover:bg-red-700 text-white",
          tabActive: "bg-blue-600 text-white",
          tabInactive: "bg-gray-100 text-gray-600 hover:bg-gray-200",
          stateBadge: {
            BROUILLON: "bg-yellow-100 text-yellow-800 border-yellow-300",
            PUBLIE: "bg-green-100 text-green-800 border-green-300",
            ARCHIVE: "bg-gray-100 text-gray-600 border-gray-300",
            EN_ATTENTE_VALIDATION:
              "bg-orange-100 text-orange-800 border-orange-300",
          },
        };
      default:
        return {
          background: "bg-gray-900",
          cardBg: "bg-black/20",
          textColor: "text-gray-200",
          titleColor: "text-white",
          borderColor: "border-white/20",
          hoverBorder: "border-white/40",
          buttonPrimary:
            "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
          buttonSecondary:
            "bg-white/10 hover:bg-white/20 text-white border border-white/20",
          buttonDanger: "bg-red-600 hover:bg-red-700 text-white",
          tabActive: "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
          tabInactive: "bg-white/10 text-gray-300 hover:bg-white/20",
          stateBadge: {
            BROUILLON: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
            PUBLIE: "bg-green-500/20 text-green-300 border-green-500/30",
            ARCHIVE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            EN_ATTENTE_VALIDATION:
              "bg-orange-500/20 text-orange-300 border-orange-500/30",
          },
        };
    }
  };

  const themeStyles = getThemeStyles();

  useEffect(() => {
    if (course?.id) {
      fetchCourseDetails();
      fetchCourseMaterials();
    }
  }, [course]);

  const fetchCourseDetails = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setCourseDetails(course);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to fetch course details:", err);
      setIsLoading(false);
    }
  };

  const fetchCourseMaterials = async () => {
    try {
      setIsLoadingMaterials(true);
      // Simulate API call
      setTimeout(() => {
        setCourseMaterials([
          { id: 1, nom: "Document.pdf", taille: "2.5 MB", url: "#" },
          { id: 2, nom: "Video.mp4", taille: "125 MB", url: "#" },
        ]);
        setIsLoadingMaterials(false);
      }, 500);
    } catch (err) {
      console.error("Failed to fetch course materials:", err);
      setIsLoadingMaterials(false);
    }
  };

  const handleStateChange = async (newState) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Simulate API call
      setTimeout(() => {
        const updatedCourse = { ...courseDetails, etat: newState };
        setCourseDetails(updatedCourse);
        setSuccessMessage(`État du cours changé vers "${newState}"`);
        setIsProcessing(false);

        setTimeout(() => {
          setSuccessMessage("");
          if (onSuccess) onSuccess();
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error("Failed to change course state:", err);
      setError(err.message || "Échec du changement d'état du cours");
      setIsProcessing(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Simulate API call
      setTimeout(() => {
        setSuccessMessage("Cours supprimé avec succès");
        setIsProcessing(false);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error("Failed to delete course:", err);
      setError(err.message || "Échec de la suppression du cours");
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStateText = (state) => {
    const stateTexts = {
      BROUILLON: "Brouillon",
      PUBLIE: "Publié",
      ARCHIVE: "Archivé",
      EN_ATTENTE_VALIDATION: "En attente de validation",
    };
    return stateTexts[state] || state;
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "mp4":
      case "avi":
      case "mov":
        return <Video className="w-5 h-5 text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const tabs = [
    { id: "overview", label: "Aperçu", icon: <Eye className="w-4 h-4" /> },
    { id: "content", label: "Contenu", icon: <BookOpen className="w-4 h-4" /> },
    {
      id: "materials",
      label: "Matériaux",
      icon: <Download className="w-4 h-4" />,
    },
    { id: "settings", label: "Paramètres", icon: <Edit className="w-4 h-4" /> },
  ];

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`${themeStyles.cardBg} backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border ${themeStyles.borderColor}`}
        >
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className={`text-2xl font-bold ${themeStyles.titleColor} mb-2`}>
              Succès
            </h3>
            <p className={`${themeStyles.textColor} mb-6`}>{successMessage}</p>
            <button
              onClick={onClose}
              className={`${themeStyles.buttonPrimary} px-6 py-2 rounded-lg font-medium transition-all duration-200`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`${themeStyles.cardBg} backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border ${themeStyles.borderColor}`}
        >
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h3 className={`text-2xl font-bold ${themeStyles.titleColor} mb-2`}>
              Confirmer la suppression
            </h3>
            <p className={`${themeStyles.textColor} mb-6`}>
              Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est
              irréversible.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                className={`${themeStyles.buttonSecondary} px-6 py-2 rounded-lg font-medium transition-all duration-200`}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={isProcessing}
                className={`${
                  themeStyles.buttonDanger
                } px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isProcessing ? "opacity-75 cursor-not-allowed" : ""
                } flex items-center gap-2`}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isProcessing ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${themeStyles.cardBg} backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border ${themeStyles.borderColor} flex flex-col`}
      >
        {/* Header */}
        <div
          className={`border-b ${themeStyles.borderColor} p-6 flex justify-between items-start flex-shrink-0`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}
              >
                {courseDetails?.titre?.charAt(0) || "C"}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-2xl font-bold ${themeStyles.titleColor} mb-2 break-words`}
                >
                  {courseDetails?.titre || "Titre du cours"}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      themeStyles.stateBadge[courseDetails?.etat] ||
                      themeStyles.stateBadge.BROUILLON
                    }`}
                  >
                    {getStateText(courseDetails?.etat)}
                  </span>
                  <span
                    className={`${themeStyles.textColor} text-sm flex items-center gap-1`}
                  >
                    <Calendar className="w-4 h-4" />
                    {courseDetails?.dateCreation
                      ? new Date(
                          courseDetails.dateCreation
                        ).toLocaleDateString()
                      : "Date non disponible"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${themeStyles.textColor} hover:text-red-500 transition-colors duration-200 p-2 rounded-lg hover:bg-red-500/10 flex-shrink-0`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`border-b ${themeStyles.borderColor} p-6 flex-shrink-0`}
        >
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  currentTab === tab.id
                    ? themeStyles.tabActive
                    : themeStyles.tabInactive
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {currentTab === "overview" && (
                <div className="space-y-6">
                  <div
                    className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                  >
                    <h3
                      className={`text-xl font-bold ${themeStyles.titleColor} mb-4`}
                    >
                      Informations du cours
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeStyles.textColor} mb-1`}
                        >
                          Titre
                        </label>
                        <p className={`${themeStyles.titleColor} font-medium`}>
                          {courseDetails?.titre || "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeStyles.textColor} mb-1`}
                        >
                          État
                        </label>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            themeStyles.stateBadge[courseDetails?.etat] ||
                            themeStyles.stateBadge.BROUILLON
                          }`}
                        >
                          {getStateText(courseDetails?.etat)}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium ${themeStyles.textColor} mb-1`}
                        >
                          Description
                        </label>
                        <p className={`${themeStyles.textColor}`}>
                          {courseDetails?.description ||
                            "Aucune description fournie"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {courseDetails?.redacteur && (
                    <div
                      className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                    >
                      <h3
                        className={`text-xl font-bold ${themeStyles.titleColor} mb-4`}
                      >
                        Professeur
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {courseDetails.redacteur.nom?.charAt(0) || "P"}
                        </div>
                        <div>
                          <p
                            className={`${themeStyles.titleColor} font-medium`}
                          >
                            {courseDetails.redacteur.nom}{" "}
                            {courseDetails.redacteur.prenom}
                          </p>
                          <p className={`${themeStyles.textColor} text-sm`}>
                            {courseDetails.redacteur.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {courseDetails?.matieres &&
                    courseDetails.matieres.length > 0 && (
                      <div
                        className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                      >
                        <h3
                          className={`text-xl font-bold ${themeStyles.titleColor} mb-4`}
                        >
                          Matières
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {courseDetails.matieres.map((matiere, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30"
                            >
                              {matiere.nom || matiere}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {currentTab === "content" && (
                <div className="space-y-6">
                  <div
                    className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                  >
                    <h3
                      className={`text-xl font-bold ${themeStyles.titleColor} mb-4`}
                    >
                      Contenu du cours
                    </h3>
                    <div
                      className={`${themeStyles.textColor} prose prose-invert max-w-none`}
                    >
                      {courseDetails?.contenu ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: courseDetails.contenu,
                          }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">
                          Aucun contenu disponible
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentTab === "materials" && (
                <div className="space-y-6">
                  <div
                    className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                  >
                    <h3
                      className={`text-xl font-bold ${themeStyles.titleColor} mb-4`}
                    >
                      Matériaux du cours
                    </h3>

                    {isLoadingMaterials ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    ) : courseMaterials.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText
                          className={`w-16 h-16 ${themeStyles.textColor} opacity-50 mx-auto mb-4`}
                        />
                        <p className={`${themeStyles.textColor} opacity-75`}>
                          Aucun matériau disponible
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courseMaterials.map((material, index) => (
                          <div
                            key={material.id || index}
                            className={`flex items-center gap-4 p-4 rounded-xl border ${themeStyles.borderColor} hover:${themeStyles.hoverBorder} transition-all duration-200`}
                          >
                            {getFileTypeIcon(
                              material.nom || material.name || "file"
                            )}
                            <div className="flex-1">
                              <p
                                className={`${themeStyles.titleColor} font-medium`}
                              >
                                {material.nom || material.name || "Document"}
                              </p>
                              <p
                                className={`${themeStyles.textColor} text-sm opacity-75`}
                              >
                                {material.taille ||
                                  material.size ||
                                  "Taille inconnue"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                window.open(
                                  material.url || material.downloadUrl,
                                  "_blank"
                                )
                              }
                              className={`${themeStyles.buttonSecondary} p-2 rounded-lg transition-all duration-200`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTab === "settings" && (
                <div className="space-y-6">
                  <div
                    className={`${themeStyles.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${themeStyles.borderColor}`}
                  >
                    <h3
                      className={`text-xl font-bold ${themeStyles.titleColor} mb-6`}
                    >
                      Actions du cours
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4
                          className={`text-lg font-medium ${themeStyles.titleColor} mb-3`}
                        >
                          Changer l'état
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {[
                            "BROUILLON",
                            "PUBLIE",
                            "ARCHIVE",
                            "EN_ATTENTE_VALIDATION",
                          ].map((state) => (
                            <button
                              key={state}
                              onClick={() => handleStateChange(state)}
                              disabled={
                                isProcessing || courseDetails?.etat === state
                              }
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                courseDetails?.etat === state
                                  ? "opacity-50 cursor-not-allowed"
                                  : themeStyles.buttonSecondary
                              } ${
                                isProcessing
                                  ? "opacity-75 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {getStateText(state)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-700">
                        <h4
                          className={`text-lg font-medium ${themeStyles.titleColor} mb-3`}
                        >
                          Actions avancées
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(courseDetails)}
                              className={`${themeStyles.buttonPrimary} px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2`}
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </button>
                          )}

                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isProcessing}
                            className={`${
                              themeStyles.buttonDanger
                            } px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                              isProcessing
                                ? "opacity-75 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className={`border-t ${themeStyles.borderColor} p-6 flex justify-between items-center flex-shrink-0`}
        >
          <div className={`${themeStyles.textColor} text-sm`}>
            ID du cours: {courseDetails?.id || "Non disponible"}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`${themeStyles.buttonSecondary} px-6 py-2 rounded-lg font-medium transition-all duration-200`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewModal;
