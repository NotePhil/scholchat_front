import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFileLines, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import DocumentViewer from "../viewers/DocumentViewer";

/**
 * Attachments of an exercise question (images / PDFs), shown the same way
 * everywhere (attempt, result, professor's question details): lazy image
 * thumbnails and file chips that open in the shared DocumentViewer (image
 * lightbox, in-app PDF viewer, download for other files).
 *
 * Props: medias — [{id, fileName, contentType, mediaType, presignedUrl, fileSize}]
 *        className — extra wrapper classes
 */
const isImage = (m) =>
  m?.mediaType === "IMAGE" || (m?.contentType || "").startsWith("image/");

const urlOf = (m) =>
  m?.presignedUrl ||
  m?.previewUrl ||
  (m?.id ? `${process.env.REACT_APP_API_BASE_URL || ""}/media/${m.id}/content` : "");

const formatSize = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
};

const QuestionMediaList = ({ medias, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!Array.isArray(medias) || medias.length === 0) return null;

  const open = (m) => {
    const url = urlOf(m);
    if (!url) return;
    setViewer({
      url,
      fileName: m.fileName || (isImage(m) ? "Image" : "Document"),
      contentType: m.contentType || (isImage(m) ? "image/jpeg" : ""),
    });
  };

  return (
    <div ref={ref} className={`flex flex-wrap gap-2 ${className}`}>
      {medias.map((m, i) => {
        const key = m.id || `${m.fileName}-${i}`;
        const url = urlOf(m);
        if (isImage(m)) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => open(m)}
              title={m.fileName || "Image"}
              aria-label={`Agrandir ${m.fileName || "l'image"}`}
              className="block w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-zoom-in"
            >
              {visible && url ? (
                <img src={url} alt={m.fileName || ""} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700" />
              )}
            </button>
          );
        }
        const pdf = /pdf/i.test(m.contentType || "") || /\.pdf$/i.test(m.fileName || "");
        const size = formatSize(m.fileSize);
        return (
          <button
            key={key}
            type="button"
            onClick={() => open(m)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 max-w-full"
          >
            <FontAwesomeIcon
              icon={pdf ? faFilePdf : faFileLines}
              className={`w-4 h-4 flex-shrink-0 ${pdf ? "text-red-500" : "text-slate-500"}`}
            />
            <span className="max-w-[160px] truncate">{m.fileName || "Document"}</span>
            {size && <span className="text-gray-400 flex-shrink-0">{size}</span>}
            <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-indigo-500 flex-shrink-0" />
          </button>
        );
      })}
      {viewer && (
        <DocumentViewer
          isOpen
          url={viewer.url}
          fileName={viewer.fileName}
          contentType={viewer.contentType}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

export default QuestionMediaList;
