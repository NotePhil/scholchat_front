import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  User,
  Calendar,
  Mail,
  Phone,
  Shield,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { rejectionService } from "../../../../services/RejectionService";
import { minioS3Service } from "../../../../services/minioS3";

// Image Modal Component for zooming - Updated with better z-index
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

const UserViewModal = ({ user, onClose, onSuccess }) => {
  const [showRejectionOptions, setShowRejectionOptions] = useState(false);
  const [rejectionMotifs, setRejectionMotifs] = useState([]);
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [customMotif, setCustomMotif] = useState("");
  const [isLoadingMotifs, setIsLoadingMotifs] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState({});

  // Image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Updated function to handle all possible status combinations
  const shouldShowActions = () => {
    // Show actions for users awaiting validation
    return (
      user?.etat === "AWAITING_VALIDATION" ||
      user?.etat === "EN_ATTENTE" ||
      user?.etat === "EN_ATTENTE"
    );
  };

  useEffect(() => {
    if (shouldShowActions()) {
      fetchRejectionMotifs();
    }
    fetchUserDocuments();
  }, [user]);

  const fetchRejectionMotifs = async () => {
    try {
      setIsLoadingMotifs(true);
      const motifs = await rejectionService.getAllMotifs();
      setRejectionMotifs(motifs);
    } catch (err) {
      console.error("Échec du chargement des motifs de rejet:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError("Échec du chargement des motifs de rejet");
      }
    } finally {
      setIsLoadingMotifs(false);
    }
  };

  const getDocumentUrl = async (document) => {
    try {
      const downloadData = await minioS3Service.generateDownloadUrl(
        document.id
      );
      return downloadData.downloadUrl;
    } catch (error) {
      console.error("Failed to get document URL:", error);
      return "https://via.placeholder.com/300x300?text=Document+Non+Trouvé";
    }
  };

  const fetchUserDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      setError(null);

      const userId = user?.id;
      if (!userId) {
        setUserDocuments([]);
        return;
      }

      const documents = await minioS3Service.getUserMedia(userId);

      // Get URLs for all documents using Promise.all
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => ({
          id: doc.id,
          title: doc.fileName || "Document sans nom",
          url: await getDocumentUrl(doc),
          type: doc.contentType,
          size: doc.fileSize,
          uploadDate: doc.uploadedDate,
          fileType: doc.fileType,
          mediaType: doc.mediaType,
        }))
      );

      setUserDocuments(documentsWithUrls);
    } catch (err) {
      console.error("Échec du chargement des documents:", err);
      setError("Échec du chargement des documents de l'utilisateur");
      setUserDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      setDownloadingFiles((prev) => ({ ...prev, [document.id]: true }));

      const downloadData = await minioS3Service.generateDownloadUrl(
        document.id
      );

      const link = document.createElement("a");
      link.href = downloadData.downloadUrl;
      link.download = document.title;
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

  const toggleMotif = (motif) => {
    setSelectedMotifs((prev) =>
      prev.some((m) => m.id === motif.id)
        ? prev.filter((m) => m.id !== motif.id)
        : [...prev, motif]
    );
  };

  const handleSuccess = () => {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
    onClose();
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const primaryMotif = selectedMotifs[0] || {
        code: "CUSTOM",
        descriptif: customMotif,
      };

      await rejectionService.rejectProfessor(user.id, {
        codeErreur: primaryMotif.code,
        motifSupplementaire: customMotif || primaryMotif.descriptif,
      });

      setSuccessMessage("Professeur rejeté avec succès");
      setTimeout(() => {
        handleSuccess();
      }, 2000);
    } catch (err) {
      console.error("Échec du rejet:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError(
          err.message || "Échec du rejet du professeur. Veuillez réessayer."
        );
      } else {
        setSuccessMessage("Opération réussie (veuillez actualiser la page)");
        setTimeout(() => {
          handleSuccess();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      await rejectionService.validateProfessor(user.id);

      setSuccessMessage("Professeur approuvé avec succès");
      setTimeout(() => {
        handleSuccess();
      }, 2000);
    } catch (err) {
      console.error("Échec de l'approbation:", err);
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError(
          err.message ||
            "Échec de l'approbation du professeur. Veuillez réessayer."
        );
      } else {
        setSuccessMessage("Opération réussie (veuillez actualiser la page)");
        setTimeout(() => {
          handleSuccess();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Updated function to handle all status combinations
  const getVerificationStatusBadge = () => {
    const verificationStatus = user?.verificationStatus;
    const userState = user?.etat;
    const hasRejectionMotif = user?.motif;

    let status = "EN_ATTENTE";
    let statusText = "En attente de vérification";
    let statusClass = "bg-yellow-100 text-yellow-800";

    // Handle ACTIVE state (approved)
    if (userState === "ACTIVE" || userState === "APPROUVEE") {
      status = "APPROVED";
      statusText = "Approuvé";
      statusClass = "bg-green-100 text-green-800";
    }
    // Handle REJECTED/INACTIVE state
    else if (
      userState === "INACTIVE" ||
      userState === "REJETEE" ||
      userState === "REJECTED" ||
      verificationStatus === "REJECTED"
    ) {
      status = "REJECTED";
      statusText = "Rejeté";
      statusClass = "bg-red-100 text-red-800";
    }
    // Handle EN_ATTENTE states
    else if (
      userState === "AWAITING_VALIDATION" ||
      userState === "EN_ATTENTE" ||
      userState === "EN_ATTENTE"
    ) {
      status = "AWAITING_VALIDATION";
      statusText = "En attente de validation";
      statusClass = "bg-yellow-100 text-yellow-800";
    }
    // Handle verification status
    else if (verificationStatus === "APPROVED") {
      status = "APPROVED";
      statusText = "Approuvé";
      statusClass = "bg-green-100 text-green-800";
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}
      >
        {statusText}
      </span>
    );
  };

  // Updated function to handle processing status messages
  const getProcessingStatusMessage = () => {
    const verificationStatus = user?.verificationStatus;
    const userState = user?.etat;
    const hasRejectionMotif = user?.motif;

    if (userState === "ACTIVE" || userState === "APPROUVEE") {
      return {
        type: "success",
        message: "Ce professeur a déjà été approuvé et validé.",
      };
    }

    if (
      userState === "INACTIVE" ||
      userState === "REJETEE" ||
      userState === "REJECTED" ||
      verificationStatus === "REJECTED"
    ) {
      return {
        type: "error",
        message: `Ce professeur a déjà été rejeté${
          hasRejectionMotif
            ? ` pour le motif suivant: ${hasRejectionMotif}`
            : "."
        }`,
      };
    }

    if (verificationStatus === "APPROVED") {
      return {
        type: "success",
        message: "Ce professeur a déjà été approuvé et validé.",
      };
    }

    return null;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
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

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith("image/")) return "🖼️";
    if (contentType?.startsWith("video/")) return "🎥";
    if (contentType?.includes("pdf")) return "📄";
    if (contentType?.includes("word")) return "📝";
    if (contentType?.includes("excel") || contentType?.includes("sheet"))
      return "📊";
    if (contentType?.includes("text")) return "📃";
    return "📁";
  };

  // Get all image documents
  const imageDocuments = userDocuments.filter((doc) =>
    doc.type?.startsWith("image/")
  );

  // Handle image click to open modal
  const handleImageClick = (doc) => {
    const imageIndex = imageDocuments.findIndex((img) => img.id === doc.id);
    setCurrentImageIndex(imageIndex);
    setIsImageModalOpen(true);
  };

  // Group documents by type
  const groupDocumentsByType = () => {
    const images = userDocuments.filter((doc) =>
      doc.type?.startsWith("image/")
    );
    const others = userDocuments.filter(
      (doc) => !doc.type?.startsWith("image/")
    );
    return { images, others };
  };

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Succès</h3>
            <div className="text-sm text-gray-500 mb-4">{successMessage}</div>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              onClick={handleSuccess}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusMessage = getProcessingStatusMessage();
  const showActions = shouldShowActions();
  const { images, others } = groupDocumentsByType();

  return (
    <>
      {/* Updated modal with same styling approach as CreateCourseFormModal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative">
          {/* Header - Fixed and sticky */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                <User className="mr-2 sm:mr-3 text-indigo-600" size={24} />
                <span className="hidden sm:inline">
                  Détails de l'utilisateur
                </span>
                <span className="sm:hidden">Utilisateur</span>
              </h2>
              <div className="flex items-center space-x-3 sm:space-x-4">
                {getVerificationStatusBadge()}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
                <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {statusMessage && (
              <div
                className={`mt-4 p-3 rounded-lg flex items-start ${
                  statusMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-orange-50 border border-orange-200 text-orange-700"
                }`}
              >
                <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{statusMessage.message}</span>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col xl:flex-row gap-6">
              {/* User Information Section */}
              <div className="flex-1">
                <div className="bg-slate-50 rounded-xl p-4 sm:p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                    <Shield size={18} className="mr-2 text-indigo-600" />
                    Informations personnelles
                  </h3>

                  {/* User Avatar and Name */}
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {user?.nom?.charAt(0)}
                      {user?.prenom?.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-xl font-bold text-slate-900">
                        {user?.nom} {user?.prenom}
                      </div>
                      <div className="text-sm text-slate-500 capitalize flex items-center">
                        <User size={14} className="mr-1" />
                        {user?.type}
                      </div>
                    </div>
                  </div>

                  {/* User Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500 flex items-center">
                        <Mail size={14} className="mr-1" />
                        Email
                      </p>
                      <p className="font-medium text-slate-900 break-all">
                        {user?.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500 flex items-center">
                        <Phone size={14} className="mr-1" />
                        Téléphone
                      </p>
                      <p className="font-medium text-slate-900">
                        {user?.telephone || "Non fourni"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500 flex items-center">
                        <Shield size={14} className="mr-1" />
                        Statut
                      </p>
                      <div>{getVerificationStatusBadge()}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500 flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Date d'inscription
                      </p>
                      <p className="font-medium text-slate-900">
                        {user?.dateCreation
                          ? new Date(user.dateCreation).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "Non disponible"}
                      </p>
                    </div>
                    {user?.motif && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-sm font-medium text-slate-500">
                          Motif de rejet
                        </p>
                        <p className="font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                          {user.motif}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <FileText size={18} className="mr-2 text-indigo-600" />
                    Documents de l'utilisateur ({userDocuments.length})
                  </h3>

                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center p-8 text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3">Chargement des documents...</span>
                    </div>
                  ) : userDocuments.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg text-center text-slate-500 border-2 border-dashed border-slate-300">
                      <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                      <p className="text-lg font-medium mb-1">
                        Aucun document trouvé
                      </p>
                      <p className="text-sm">
                        Cet utilisateur n'a téléchargé aucun document
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Images section - Grid layout for responsive design */}
                      {images.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold mb-4 text-slate-700 flex items-center">
                            <ImageIcon
                              size={16}
                              className="mr-2 text-indigo-600"
                            />
                            Images ({images.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((doc, index) => (
                              <div
                                key={doc.id}
                                className="bg-white p-3 rounded-lg border-2 border-slate-200 group cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all duration-300"
                                onClick={() => handleImageClick(doc)}
                              >
                                <div className="relative">
                                  <div className="aspect-w-16 aspect-h-9 mb-3">
                                    <img
                                      src={doc.url}
                                      alt={doc.title}
                                      className="w-full h-32 sm:h-40 object-cover rounded-lg bg-slate-100 border group-hover:scale-105 transition-transform duration-300 shadow-sm"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "https://via.placeholder.com/300x200?text=Image+Non+Trouvée";
                                      }}
                                    />
                                  </div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg">
                                      <ZoomIn className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <h5
                                      className="font-semibold text-sm text-slate-900 truncate mb-2"
                                      title={doc.title}
                                    >
                                      {doc.title}
                                    </h5>
                                    <div className="text-xs text-slate-500 space-y-1">
                                      <p className="flex items-center">
                                        <File size={12} className="mr-1" />
                                        {formatFileSize(doc.size)}
                                      </p>
                                      <p className="flex items-center">
                                        <Calendar size={12} className="mr-1" />
                                        {formatDate(doc.uploadDate)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(doc);
                                    }}
                                    disabled={downloadingFiles[doc.id]}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors shadow-sm hover:shadow-md"
                                    title="Télécharger l'image"
                                  >
                                    {downloadingFiles[doc.id] ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other documents section */}
                      {others.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold mb-4 text-slate-700 flex items-center">
                            <File size={16} className="mr-2 text-indigo-600" />
                            Autres documents ({others.length})
                          </h4>
                          <div className="space-y-3">
                            {others.map((doc) => (
                              <div
                                key={doc.id}
                                className="bg-white p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                      <span className="text-lg">
                                        {getFileIcon(doc.type)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5
                                        className="font-semibold text-sm text-slate-900 truncate mb-1"
                                        title={doc.title}
                                      >
                                        {doc.title}
                                      </h5>
                                      <div className="text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-3 gap-1">
                                        <p className="flex items-center">
                                          <File size={12} className="mr-1" />
                                          {doc.type
                                            ? doc.type
                                                .split("/")[1]
                                                ?.toUpperCase() || "Inconnu"
                                            : "Inconnu"}
                                        </p>
                                        <p className="flex items-center">
                                          <Download
                                            size={12}
                                            className="mr-1"
                                          />
                                          {formatFileSize(doc.size)}
                                        </p>
                                        <p className="flex items-center">
                                          <Calendar
                                            size={12}
                                            className="mr-1"
                                          />
                                          {formatDate(doc.uploadDate)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloadingFiles[doc.id]}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-3 transition-colors shadow-sm hover:shadow-md"
                                    title="Télécharger le document"
                                  >
                                    {downloadingFiles[doc.id] ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section - Responsive sidebar */}
              {showActions && (
                <div className="flex-shrink-0 w-full xl:w-80">
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6 sticky top-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                      <Shield size={18} className="mr-2 text-indigo-600" />
                      Actions de validation
                    </h3>

                    <div className="space-y-4">
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                          isProcessing
                            ? "opacity-75 cursor-not-allowed transform-none"
                            : ""
                        }`}
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        ) : (
                          <Check className="w-5 h-5 mr-2" />
                        )}
                        <span className="hidden sm:inline">
                          Approuver le professeur
                        </span>
                        <span className="sm:hidden">Approuver</span>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowRejectionOptions(!showRejectionOptions)
                          }
                          disabled={isProcessing}
                          className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                            isProcessing
                              ? "opacity-75 cursor-not-allowed transform-none"
                              : ""
                          }`}
                        >
                          <X className="w-5 h-5 mr-2" />
                          <span className="flex-1 hidden sm:inline">
                            Rejeter le professeur
                          </span>
                          <span className="flex-1 sm:hidden">Rejeter</span>
                          {showRejectionOptions ? (
                            <ChevronUp className="w-5 h-5 ml-2" />
                          ) : (
                            <ChevronDown className="w-5 h-5 ml-2" />
                          )}
                        </button>

                        {showRejectionOptions && (
                          <div className="mt-4 p-4 bg-white border-2 border-red-200 rounded-xl shadow-lg">
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                              <AlertCircle
                                size={16}
                                className="mr-2 text-red-600"
                              />
                              Motifs de rejet
                            </h4>

                            {isLoadingMotifs ? (
                              <div className="py-4 text-slate-500 text-sm flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600 mr-2"></div>
                                Chargement des motifs...
                              </div>
                            ) : (
                              <div className="max-h-40 overflow-y-auto mb-4 pr-2 space-y-2">
                                {rejectionMotifs.map((motif) => (
                                  <label
                                    key={motif.id}
                                    className="flex items-start p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      className="mr-3 mt-1 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                      checked={selectedMotifs.some(
                                        (m) => m.id === motif.id
                                      )}
                                      onChange={() => toggleMotif(motif)}
                                      disabled={isProcessing}
                                    />
                                    <span className="text-sm text-slate-700 leading-relaxed">
                                      {motif.descriptif}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            <div className="mb-4">
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Motif personnalisé :
                              </label>
                              <textarea
                                value={customMotif}
                                onChange={(e) => setCustomMotif(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                                rows="3"
                                placeholder="Ajoutez des détails supplémentaires..."
                                disabled={isProcessing}
                              ></textarea>
                            </div>

                            <button
                              onClick={handleReject}
                              disabled={
                                (selectedMotifs.length === 0 &&
                                  !customMotif.trim()) ||
                                isProcessing
                              }
                              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                                (selectedMotifs.length === 0 &&
                                  !customMotif.trim()) ||
                                isProcessing
                                  ? "bg-slate-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              }`}
                            >
                              {isProcessing ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                  Traitement en cours...
                                </div>
                              ) : (
                                "Confirmer le rejet"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

export default UserViewModal;
