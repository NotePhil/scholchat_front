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
} from "lucide-react";
import { rejectionService } from "../../../../services/RejectionService";
import { minioS3Service } from "../../../../services/minioS3";

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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]">
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
          className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 z-10"
        >
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 z-10"
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
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          className="text-white hover:text-gray-300 p-2 rounded"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm px-2">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="text-white hover:text-gray-300 p-2 rounded"
          disabled={zoom >= 5}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-400 mx-2"></div>
        <button
          onClick={handleRotate}
          className="text-white hover:text-gray-300 p-2 rounded"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="text-white hover:text-gray-300 p-2 rounded"
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
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <Check className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Succès</h3>
            <div className="mt-2 text-sm text-gray-500">{successMessage}</div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={handleSuccess}
              >
                Fermer
              </button>
            </div>
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
      <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 pt-8">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-gray-800">
              Détails de l'utilisateur
            </h2>
            <div className="flex items-center space-x-4">
              {getVerificationStatusBadge()}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 pt-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div
                className={`mb-4 p-3 rounded-md flex items-center ${
                  statusMessage.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{statusMessage.message}</span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Informations de l'utilisateur
                  </h3>

                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-medium">
                      {user?.nom?.charAt(0)}
                      {user?.prenom?.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-xl font-semibold text-gray-900">
                        {user?.nom} {user?.prenom}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {user?.type}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">
                        {user?.telephone || "Non fourni"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Statut</p>
                      <p className="font-medium">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user?.etat === "ACTIVE" ||
                            user?.etat === "APPROUVEE"
                              ? "bg-green-100 text-green-800"
                              : user?.etat === "EN_ATTENTE" ||
                                user?.etat === "AWAITING_VALIDATION" ||
                                user?.etat === "EN_ATTENTE"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user?.etat}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Date d'inscription
                      </p>
                      <p className="font-medium">
                        {user?.dateCreation
                          ? new Date(user.dateCreation).toLocaleDateString()
                          : "Non disponible"}
                      </p>
                    </div>
                    {user?.motif && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Motif de rejet</p>
                        <p className="font-medium text-red-600">{user.motif}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showActions && (
                <div className="flex-shrink-0 w-full lg:w-64">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4 text-gray-800">
                      Actions
                    </h3>

                    <div className="space-y-3">
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center ${
                          isProcessing ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      >
                        {isProcessing ? (
                          <span className="animate-spin mr-2">↻</span>
                        ) : (
                          <Check className="w-5 h-5 mr-2" />
                        )}
                        Approuver
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowRejectionOptions(!showRejectionOptions)
                          }
                          disabled={isProcessing}
                          className={`w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center ${
                            isProcessing ? "opacity-75 cursor-not-allowed" : ""
                          }`}
                        >
                          <X className="w-5 h-5 mr-2" />
                          Rejeter
                          {showRejectionOptions ? (
                            <ChevronUp className="w-5 h-5 ml-2" />
                          ) : (
                            <ChevronDown className="w-5 h-5 ml-2" />
                          )}
                        </button>

                        {showRejectionOptions && (
                          <div className="mt-2 p-4 bg-white border border-gray-200 rounded-md shadow-lg">
                            <h4 className="font-medium mb-2">
                              Sélectionnez les motifs:
                            </h4>

                            {isLoadingMotifs ? (
                              <div className="py-2 text-gray-500 text-sm">
                                Chargement des motifs...
                              </div>
                            ) : (
                              <div className="max-h-40 overflow-y-auto mb-3">
                                {rejectionMotifs.map((motif) => (
                                  <label
                                    key={motif.id}
                                    className="flex items-center mb-2"
                                  >
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      checked={selectedMotifs.some(
                                        (m) => m.id === motif.id
                                      )}
                                      onChange={() => toggleMotif(motif)}
                                      disabled={isProcessing}
                                    />
                                    <span className="text-sm">
                                      {motif.descriptif}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1">
                                Ajouter un motif personnalisé:
                              </label>
                              <textarea
                                value={customMotif}
                                onChange={(e) => setCustomMotif(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                rows="2"
                                placeholder="Détails supplémentaires..."
                                disabled={isProcessing}
                              ></textarea>
                            </div>

                            <button
                              onClick={handleReject}
                              disabled={
                                (selectedMotifs.length === 0 && !customMotif) ||
                                isProcessing
                              }
                              className={`w-full py-1 px-3 rounded-md text-white ${
                                (selectedMotifs.length === 0 && !customMotif) ||
                                isProcessing
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              {isProcessing
                                ? "Traitement en cours..."
                                : "Confirmer le rejet"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents section - Enhanced with horizontal image layout */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800">
                Documents de l'utilisateur ({userDocuments.length})
              </h3>

              {isLoadingDocuments ? (
                <div className="flex justify-center items-center p-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Chargement des documents...</span>
                </div>
              ) : userDocuments.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>Aucun document trouvé pour cet utilisateur</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Images section - Horizontal layout */}
                  {images.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                        <span className="text-lg mr-2">🖼️</span>
                        Images ({images.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((doc, index) => (
                          <div
                            key={doc.id}
                            className="bg-gray-50 p-3 rounded-lg border group cursor-pointer hover:shadow-lg transition-all duration-200"
                            onClick={() => handleImageClick(doc)}
                          >
                            <div className="relative">
                              <div className="aspect-w-16 aspect-h-9 mb-3">
                                <img
                                  src={doc.url}
                                  alt={doc.title}
                                  className="w-full h-40 object-cover rounded-md bg-white border group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/300x200?text=Image+Non+Trouvée";
                                  }}
                                />
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-2">
                                <h5
                                  className="font-medium text-sm truncate"
                                  title={doc.title}
                                >
                                  {doc.title}
                                </h5>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p>Taille: {formatFileSize(doc.size)}</p>
                                  <p>
                                    Uploadé le: {formatDate(doc.uploadDate)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(doc);
                                }}
                                disabled={downloadingFiles[doc.id]}
                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="Télécharger l'image"
                              >
                                {downloadingFiles[doc.id] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                ) : (
                                  <Download className="w-3 h-3" />
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
                      <h4 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Autres documents ({others.length})
                      </h4>
                      <div className="space-y-3">
                        {others.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-gray-50 p-4 rounded-lg border"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <span className="text-xl flex-shrink-0">
                                  {getFileIcon(doc.type)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <h5
                                    className="font-medium text-sm truncate"
                                    title={doc.title}
                                  >
                                    {doc.title}
                                  </h5>
                                  <div className="text-xs text-gray-500 grid grid-cols-1 md:grid-cols-3 gap-1">
                                    <p>Type: {doc.type || "Inconnu"}</p>
                                    <p>Taille: {formatFileSize(doc.size)}</p>
                                    <p>
                                      Uploadé le: {formatDate(doc.uploadDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingFiles[doc.id]}
                                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-3"
                                title="Télécharger le document"
                              >
                                {downloadingFiles[doc.id] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
