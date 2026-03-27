import React, { useState } from "react";
import { X, Download, FileText, File, Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Universal Document Viewer - supports PDF, images, videos, and office docs
 * - PDF: uses browser's built-in PDF viewer via iframe
 * - Images: displays inline with zoom
 * - Videos: streams with HTML5 video player
 * - Office docs (PPT, Excel, Word): uses Google Docs Viewer or Office Online
 */
const DocumentViewer = ({ url, fileName, contentType, onClose, isOpen }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen || !url) return null;

  const getFileType = () => {
    const name = (fileName || "").toLowerCase();
    const type = (contentType || "").toLowerCase();

    if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (type.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) return "image";
    if (type.includes("video") || /\.(mp4|webm|ogg|mov|avi)$/i.test(name)) return "video";
    if (/\.(ppt|pptx)$/i.test(name) || type.includes("presentation")) return "ppt";
    if (/\.(xls|xlsx)$/i.test(name) || type.includes("spreadsheet") || type.includes("excel")) return "excel";
    if (/\.(doc|docx)$/i.test(name) || type.includes("word") || type.includes("document")) return "word";
    return "unknown";
  };

  const fileType = getFileType();

  // Google Docs Viewer URL for office documents
  const getOfficeViewerUrl = () => {
    // For public URLs, use Google Docs Viewer
    if (url.startsWith("http")) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const containerClass = isFullscreen
    ? "fixed inset-0 z-[10000] bg-black"
    : "fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4";

  const contentClass = isFullscreen
    ? "w-full h-full"
    : "bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden";

  return (
    <div className={containerClass} onClick={!isFullscreen ? onClose : undefined}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fileName || "Document"}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full uppercase flex-shrink-0">
              {fileType}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Telecharger"
            >
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </a>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? "Reduire" : "Plein ecran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
          {/* PDF Viewer */}
          {fileType === "pdf" && (
            <iframe
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
              title={fileName}
              className="w-full h-full border-0"
              style={{ minHeight: isFullscreen ? "100vh" : "70vh" }}
            />
          )}

          {/* Image Viewer */}
          {fileType === "image" && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Video Player - Streaming */}
          {fileType === "video" && (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <video
                src={url}
                controls
                autoPlay={false}
                playsInline
                preload="metadata"
                className="max-w-full max-h-full"
                style={{ maxHeight: isFullscreen ? "100vh" : "70vh" }}
              >
                Votre navigateur ne supporte pas la lecture video.
              </video>
            </div>
          )}

          {/* Office Documents (PPT, Excel, Word) via Google Docs Viewer */}
          {(fileType === "ppt" || fileType === "excel" || fileType === "word") && (
            <iframe
              src={getOfficeViewerUrl()}
              title={fileName}
              className="w-full h-full border-0"
              style={{ minHeight: isFullscreen ? "100vh" : "70vh" }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}

          {/* Unknown file type */}
          {fileType === "unknown" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <File className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Apercu non disponible pour ce type de fichier
              </p>
              <a
                href={url}
                download={fileName}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Telecharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// File size limits configuration
export const FILE_LIMITS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeLabel: "5 Mo",
    formats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxSizeLabel: "50 Mo",
    formats: ["video/mp4", "video/webm", "video/ogg"],
  },
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxSizeLabel: "20 Mo",
    formats: [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
};

/**
 * Validate file before upload
 * Returns { valid: boolean, error: string | null }
 */
export const validateFile = (file) => {
  if (!file) return { valid: false, error: "Aucun fichier selectionne" };

  const type = file.type;
  const size = file.size;

  // Determine category
  let category = "document";
  if (type.startsWith("image/")) category = "image";
  else if (type.startsWith("video/")) category = "video";

  const limits = FILE_LIMITS[category];

  if (size > limits.maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux (${(size / 1024 / 1024).toFixed(1)} Mo). Taille maximale: ${limits.maxSizeLabel}`,
    };
  }

  return { valid: true, error: null };
};

export default DocumentViewer;
