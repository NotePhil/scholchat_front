import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  User,
  Mail,
  Phone,
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
  Users,
  School,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ImageIcon,
  File,
} from "lucide-react";

// Image Modal Component for zooming
const ImageModal = ({ isOpen, onClose, images, currentIndex, onNavigate }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, currentIndex]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.5, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyPress = (e) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        if (currentIndex > 0) onNavigate(currentIndex - 1);
        break;
      case "ArrowRight":
        if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
        break;
      case "+":
      case "=":
        handleZoomIn();
        break;
      case "-":
        handleZoomOut();
        break;
      case "r":
      case "R":
        handleRotate();
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isOpen, isDragging, dragStart, currentIndex, images.length]);

  if (!isOpen || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      {/* Header with controls */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-10">
        <div className="text-white">
          <h3 className="text-lg font-medium">{currentImage.title}</h3>
          <p className="text-sm opacity-75">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 p-2 rounded-full bg-black/50 backdrop-blur-sm transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 backdrop-blur-sm z-10 transition-colors"
        >
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 backdrop-blur-sm z-10 transition-colors"
        >
          <ChevronDown className="w-6 h-6 -rotate-90" />
        </button>
      )}

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center p-16">
        <img
          src={currentImage.url}
          alt={currentImage.title}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
            zoom > 1 ? "cursor-move" : "cursor-zoom-in"
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          onMouseDown={handleMouseDown}
          onClick={zoom === 1 ? handleZoomIn : undefined}
          draggable={false}
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          className="text-white hover:text-gray-300 p-2 rounded transition-colors"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm px-2">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="text-white hover:text-gray-300 p-2 rounded transition-colors"
          disabled={zoom >= 5}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-400 mx-2"></div>
        <button
          onClick={handleRotate}
          className="text-white hover:text-gray-300 p-2 rounded transition-colors"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="text-white hover:text-gray-300 p-2 rounded transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const UserViewEleve = ({ user, onClose, userType = "eleve" }) => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [documentViewMode, setDocumentViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("info");
  const [students, setStudents] = useState([]);
  const [downloadingFiles, setDownloadingFiles] = useState({});

  // Image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      // Fetch documents
      const documents = [];
      const documentFields = [
        { field: "cniUrlFront", title: "CNI Recto", type: "identity" },
        { field: "cniUrlBack", title: "CNI Verso", type: "identity" },
        {
          field: "photoFullPicture",
          title: "Photo de profil",
          type: "profile",
        },
      ];

      documentFields.forEach(({ field, title, type }) => {
        if (user[field]) {
          documents.push({
            id: field,
            title,
            url: user[field],
            type,
            uploadedDate: user.dateCreation || new Date().toISOString(),
          });
        }
      });

      setUserDocuments(documents);
      setFilteredDocuments(documents);

      // Fetch students if eleve has classes
      if (userType === "eleve" && user.classes && user.classes.length > 0) {
        const allStudents = [];
        for (const cls of user.classes) {
          if (cls.eleves && cls.eleves.length > 0) {
            allStudents.push(
              ...cls.eleves.map((student) => ({
                ...student,
                className: cls.nom,
                establishment: cls.etablissement,
              }))
            );
          }
        }
        setStudents(allStudents);
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
      setError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = userDocuments;

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

  useEffect(() => {
    filterDocuments();
  }, [documentSearchTerm, documentFilter]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: {
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "Actif",
      },
      INACTIVE: {
        className: "bg-red-50 text-red-700 border-red-200",
        text: "Inactif",
      },
      EN_ATTENTE: {
        className: "bg-amber-50 text-amber-700 border-amber-200",
        text: "En attente",
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
            status === "ACTIVE"
              ? "bg-emerald-500"
              : status === "INACTIVE"
              ? "bg-red-500"
              : status === "EN_ATTENTE"
              ? "bg-amber-500"
              : "bg-slate-500"
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

  const handleDocumentDownload = async (document) => {
    try {
      setDownloadingFiles((prev) => ({ ...prev, [document.id]: true }));

      const link = document.createElement("a");
      link.href = document.url;
      link.download = `${document.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download document:", error);
      setError("Échec du téléchargement du document");
    } finally {
      setDownloadingFiles((prev) => ({ ...prev, [document.id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get all image documents for modal
  const imageDocuments = userDocuments.filter(
    (doc) => doc.url && (doc.type === "identity" || doc.type === "profile")
  );

  // Handle image click to open modal
  const handleImageClick = (doc) => {
    const imageIndex = imageDocuments.findIndex((img) => img.id === doc.id);
    setCurrentImageIndex(imageIndex);
    setIsImageModalOpen(true);
  };

  return (
    <>
      {/* Modal structure with backdrop blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
          {/* Header - Fixed and sticky with better responsive design */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                <Users className="mr-2 sm:mr-3 text-blue-600" size={24} />
                <span className="hidden sm:inline">Profil Élève</span>
                <span className="sm:hidden">Profil Élève</span>
              </h2>
              <div className="flex items-center space-x-3 sm:space-x-4">
                {getStatusBadge(user?.etat)}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Error display in header */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
                <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Tabs - Better responsive design */}
            <div className="mt-4 border-b border-slate-200 -mb-4">
              <div className="flex space-x-4 sm:space-x-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === "info"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  Informations
                </button>
                {userType === "eleve" && students.length > 0 && (
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab === "students"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="hidden sm:inline">
                      Camarades ({students.length})
                    </span>
                    <span className="sm:hidden">Camarades</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === "documents"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="hidden sm:inline">
                    Documents ({userDocuments.length})
                  </span>
                  <span className="sm:hidden">Docs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content with proper spacing */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
              <div className="space-y-4 sm:space-y-6">
                {/* Personal Info Tab */}
                {activeTab === "info" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Informations personnelles
                      </h3>

                      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                        {/* Avatar and basic info */}
                        <div className="flex-shrink-0">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="relative">
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl">
                                <span className="text-white font-bold text-lg sm:text-2xl">
                                  {user?.nom?.charAt(0)}
                                  {user?.prenom?.charAt(0)}
                                </span>
                              </div>
                              <div className="absolute -bottom-2 -right-2">
                                <div
                                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white ${
                                    user?.etat === "ACTIVE"
                                      ? "bg-emerald-500"
                                      : user?.etat === "INACTIVE"
                                      ? "bg-red-500"
                                      : "bg-amber-500"
                                  }`}
                                ></div>
                              </div>
                            </div>
                            <div className="text-center sm:text-left">
                              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                                {user?.nom} {user?.prenom}
                              </div>
                              <div className="text-slate-600 font-medium mt-1">
                                Élève
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="flex-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-500 font-medium">
                                    Email
                                  </p>
                                  <p className="text-slate-900 break-all text-sm sm:text-base">
                                    {user?.email}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                  <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-500 font-medium">
                                    Téléphone
                                  </p>
                                  <p className="text-slate-900 text-sm sm:text-base">
                                    {user?.telephone || "Non fourni"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                  <MapPin className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-500 font-medium">
                                    Adresse
                                  </p>
                                  <p className="text-slate-900 text-sm sm:text-base">
                                    {user?.adresse || "Non fournie"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                  <Calendar className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-500 font-medium">
                                    Date d'inscription
                                  </p>
                                  <p className="text-slate-900 text-sm sm:text-base">
                                    {user?.dateCreation
                                      ? new Date(
                                          user.dateCreation
                                        ).toLocaleDateString("fr-FR")
                                      : "Non disponible"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Classes and Establishments */}
                      {userType === "eleve" &&
                        user.classes &&
                        user.classes.length > 0 && (
                          <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-200">
                            <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center">
                              <School className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                              Établissements et Classes
                            </h4>

                            <div className="space-y-3 sm:space-y-4">
                              {user.classes.map((cls) => (
                                <div
                                  key={cls.id}
                                  className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="font-medium text-slate-900 text-sm sm:text-base">
                                        {cls.nom} ({cls.niveau})
                                      </h5>
                                      {cls.etablissement && (
                                        <div className="mt-2 space-y-1 sm:space-y-2">
                                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                                            <School className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-slate-400" />
                                            <span>{cls.etablissement.nom}</span>
                                          </div>
                                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-slate-400" />
                                            <span>
                                              {cls.etablissement.localisation},{" "}
                                              {cls.etablissement.pays}
                                            </span>
                                          </div>
                                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-slate-400" />
                                            <span>
                                              {cls.etablissement.telephone}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        cls.etat === "ACTIF"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {cls.etat}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Students Tab */}
                {activeTab === "students" && students.length > 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        <span className="hidden sm:inline">
                          Camarades de classe ({students.length})
                        </span>
                        <span className="sm:hidden">Camarades</span>
                      </h3>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {student.prenom?.charAt(0)}
                                  {student.nom?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 text-sm sm:text-base">
                                {student.prenom} {student.nom}
                              </h4>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                <div className="flex items-center">
                                  <School className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400" />
                                  <span className="truncate">
                                    {student.className}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400" />
                                  <span className="truncate">
                                    {student.email}
                                  </span>
                                </div>
                                {student.telephone && (
                                  <div className="flex items-center">
                                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400" />
                                    <span>{student.telephone}</span>
                                  </div>
                                )}
                                {student.establishment && (
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-slate-400" />
                                    <span className="truncate">
                                      {student.establishment.nom}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  student.etat === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : student.etat === "INACTIVE"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {student.etat === "ACTIVE"
                                  ? "Actif"
                                  : student.etat === "INACTIVE"
                                  ? "Inactif"
                                  : student.etat}
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
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Documents ({filteredDocuments.length})
                      </h3>

                      {/* Document Controls - Responsive */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
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
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm w-full sm:w-auto"
                          />
                        </div>

                        {/* Filter */}
                        <div className="relative">
                          <Filter
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <select
                            value={documentFilter}
                            onChange={(e) => setDocumentFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm appearance-none cursor-pointer w-full sm:w-auto"
                          >
                            <option value="all">Tous les types</option>
                            <option value="identity">Identité</option>
                            <option value="profile">Profil</option>
                          </select>
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                          <button
                            onClick={() => setDocumentViewMode("grid")}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                              documentViewMode === "grid"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Grid className="w-4 h-4 mx-auto sm:mx-0" />
                          </button>
                          <button
                            onClick={() => setDocumentViewMode("list")}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                              documentViewMode === "list"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <List className="w-4 h-4 mx-auto sm:mx-0" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Documents Content */}
                    {filteredDocuments.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                        </div>
                        <h4 className="text-base sm:text-lg font-medium text-slate-900 mb-2">
                          {documentSearchTerm || documentFilter !== "all"
                            ? "Aucun document trouvé"
                            : "Aucun document disponible"}
                        </h4>
                        <p className="text-slate-600 text-sm sm:text-base">
                          {documentSearchTerm || documentFilter !== "all"
                            ? "Essayez de modifier vos critères de recherche."
                            : "Aucun document n'a été téléchargé pour cet élève."}
                        </p>
                      </div>
                    ) : documentViewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="aspect-square relative overflow-hidden rounded-lg mb-3 sm:mb-4 group">
                              <img
                                src={doc.url}
                                alt={doc.title}
                                className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/300x300?text=Document+Non+Trouvé";
                                }}
                                onClick={() => handleImageClick(doc)}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(doc);
                                  }}
                                  className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                                  title="Voir le document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDocumentDownload(doc);
                                  }}
                                  disabled={downloadingFiles[doc.id]}
                                  className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                  title="Télécharger"
                                >
                                  {downloadingFiles[doc.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 border-t-transparent"></div>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-slate-900 truncate text-sm sm:text-base">
                                  {doc.title}
                                </h4>
                                {getDocumentTypeBadge(doc.type)}
                              </div>
                              <p className="text-xs text-slate-500">
                                Téléchargé le{" "}
                                {new Date(doc.uploadedDate).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white rounded-lg p-3 sm:p-4 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  <img
                                    src={doc.url}
                                    alt={doc.title}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg cursor-pointer"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src =
                                        "https://via.placeholder.com/48x48?text=Doc";
                                    }}
                                    onClick={() => handleImageClick(doc)}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-900 truncate text-sm sm:text-base">
                                    {doc.title}
                                  </h4>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 gap-1">
                                    {getDocumentTypeBadge(doc.type)}
                                    <span className="text-xs text-slate-500">
                                      {new Date(
                                        doc.uploadedDate
                                      ).toLocaleDateString("fr-FR")}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                                <button
                                  onClick={() => handleImageClick(doc)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Voir le document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDocumentDownload(doc)}
                                  disabled={downloadingFiles[doc.id]}
                                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title="Télécharger"
                                >
                                  {downloadingFiles[doc.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-600 border-t-transparent"></div>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={imageDocuments}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />
    </>
  );
};

export default UserViewEleve;
