import React, { useState, useEffect } from "react";
import { CheckCircle, ChevronRight, BookOpen, Lock, FileText, Image, Video, Download, ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { minioS3Service } from "../../../../../../services/minioS3";

const getFileType = (url = "", contentType = "") => {
  const u = url.toLowerCase().split("?")[0];
  if (contentType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(u)) return "image";
  if (contentType.startsWith("video/") || /\.(mp4|webm|avi|mov|mkv)$/.test(u)) return "video";
  if (contentType.includes("pdf") || u.endsWith(".pdf")) return "pdf";
  if (/\.(ppt|pptx)$/.test(u) || contentType.includes("presentation")) return "office";
  if (/\.(doc|docx)$/.test(u) || contentType.includes("word")) return "office";
  if (/\.(xls|xlsx|csv)$/.test(u) || contentType.includes("spreadsheet") || contentType.includes("excel")) return "office";
  return "file";
};

const FILE_META = {
  pdf:    { color: "bg-red-100 text-red-600",    label: "PDF" },
  office: { color: "bg-blue-100 text-blue-600",  label: "Office" },
  image:  { color: "bg-green-100 text-green-600", label: "Image" },
  video:  { color: "bg-purple-100 text-purple-600", label: "Vidéo" },
  file:   { color: "bg-gray-100 text-gray-600",  label: "Fichier" },
};

// Image popup scoped inside the panel (absolute) — does NOT cover the video conference
const ImagePopup = ({ url, fileName, onClose }) => {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-3 py-2 bg-black/70 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white text-xs font-medium truncate flex-1 mr-2">{fileName}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-white text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.25))} className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
          <a href={url} download={fileName} target="_blank" rel="noreferrer" className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"><Download className="w-3.5 h-3.5" /></a>
          <button onClick={onClose} className="p-1 bg-red-500/80 hover:bg-red-600 rounded text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-3" onClick={e => e.stopPropagation()}>
        <img src={url} alt={fileName} style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.15s", maxWidth: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
};

// File viewer with zoomable iframe for PDF/office
const FileViewer = ({ url, contentType = "", fileName = "Fichier", onImageClick }) => {
  const [preview, setPreview] = useState(false);
  const [iframeZoom, setIframeZoom] = useState(1);
  const type = getFileType(url, contentType);
  const meta = FILE_META[type] || FILE_META.file;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  const canPreview = type === "image" || type === "video" || type === "pdf" || type === "office";

  if (type === "image") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.color} flex-shrink-0`}>
            {fileName.split(".").pop()?.toUpperCase() || "IMG"}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 font-medium">{fileName}</span>
          <button
            onClick={() => onImageClick && onImageClick(url, fileName)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
          >
            <Eye className="w-3 h-3" /> Voir
          </button>
          <a href={url} download={fileName} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300">
            <Download className="w-3 h-3" />
          </a>
        </div>
        <img
          src={url}
          alt={fileName}
          className="w-full object-contain max-h-48 cursor-zoom-in bg-gray-100"
          onClick={() => onImageClick && onImageClick(url, fileName)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.color} flex-shrink-0`}>
          {fileName.split(".").pop()?.toUpperCase() || meta.label}
        </span>
        <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 font-medium">{fileName}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {canPreview && (
            <button
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
            >
              {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {preview ? "Fermer" : "Aperçu"}
            </button>
          )}
          <a href={url} target="_blank" rel="noreferrer" download={fileName}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
      </div>

      {preview && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {type === "video" && (
            <video src={url} controls playsInline className="w-full max-h-64" />
          )}
          {(type === "pdf" || type === "office") && (
            <div className="relative">
              {/* Zoom controls for iframe */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <span className="text-xs text-gray-500 flex-1">Zoom</span>
                <button onClick={() => setIframeZoom(z => Math.max(0.5, z - 0.25))} className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"><ZoomOut className="w-3 h-3" /></button>
                <span className="text-xs w-10 text-center text-gray-600">{Math.round(iframeZoom * 100)}%</span>
                <button onClick={() => setIframeZoom(z => Math.min(3, z + 0.25))} className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"><ZoomIn className="w-3 h-3" /></button>
                <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs">
                  <ExternalLink className="w-3 h-3" /> Ouvrir
                </a>
              </div>
              <div style={{ height: "420px", overflow: "hidden", position: "relative" }}>
                <iframe
                  src={type === "pdf" ? `${url}#toolbar=1&navpanes=0` : googleViewerUrl}
                  style={{ width: `${100 / iframeZoom}%`, height: `${100 / iframeZoom}%`, transform: `scale(${iframeZoom})`, transformOrigin: "top left", border: "none" }}
                  title={fileName}
                  allow="autoplay"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Parse contenu HTML to extract embedded images and file links
const extractFromContenu = (html = "") => {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const items = [];

  doc.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src");
    if (src && src.startsWith("http")) {
      const name = img.getAttribute("alt") || src.split("/").pop().split("?")[0] || "Image";
      items.push({ url: src, contentType: "image/", fileName: name });
    }
  });

  doc.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("http")) {
      const name = a.textContent.trim() || href.split("/").pop().split("?")[0] || "Fichier";
      items.push({ url: href, contentType: "", fileName: name });
    }
  });

  return items;
};

// Refresh presigned MinIO URLs in HTML content
const refreshContentUrls = async (html) => {
  if (!html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="r">${html}</div>`, "text/html");
  const root = doc.getElementById("r");

  const isMinioUrl = (url) => url && url.startsWith("http") && (url.includes("/images/") || url.includes("/documents/") || url.includes("/videos/"));

  const refreshUrl = async (url) => {
    try {
      const urlObj = new URL(url);
      const cleanPath = urlObj.pathname.replace(/^\//, "");
      const data = await minioS3Service.generateDownloadUrlByPath(cleanPath);
      return data?.downloadUrl || url;
    } catch {
      return url;
    }
  };

  const imgPromises = Array.from(root.querySelectorAll("img")).map(async img => {
    const src = img.getAttribute("src");
    if (isMinioUrl(src)) img.setAttribute("src", await refreshUrl(src));
  });

  const aPromises = Array.from(root.querySelectorAll("a[href]")).map(async a => {
    const href = a.getAttribute("href");
    if (isMinioUrl(href)) a.setAttribute("href", await refreshUrl(href));
  });

  await Promise.all([...imgPromises, ...aPromises]);
  return root.innerHTML;
};

const ChapterPanel = ({ chapitres = [], currentChapitreId, progress = [], isModerator, onSelectChapter }) => {
  const [contentExpanded, setContentExpanded] = useState(true);
  const [processedContent, setProcessedContent] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [imagePopup, setImagePopup] = useState(null);
  const [fileViewer, setFileViewer] = useState(null);

  const isCompleted = (chapId) => progress.some(p => p.chapitreId === chapId && p.completed);
  const isCurrent = (chapId) => chapId === currentChapitreId;
  const currentChap = chapitres.find(c => c.id === currentChapitreId);

  useEffect(() => {
    if (!currentChap) {
      setProcessedContent("");
      setMediaItems([]);
      return;
    }

    const process = async () => {
      const refreshed = await refreshContentUrls(currentChap.contenu || "");
      setProcessedContent(refreshed);
      setMediaItems(extractFromContenu(refreshed));
    };
    process();
  }, [currentChap?.id, currentChap?.contenu]);

  const handleContentClick = (e) => {
    // Click on image → popup
    const img = e.target.closest("img");
    if (img) {
      const url = img.getAttribute("src");
      const fileName = img.getAttribute("alt") || "Image";
      if (url) { e.preventDefault(); e.stopPropagation(); setImagePopup({ url, fileName }); }
      return;
    }
    // Click on anchor → open viewer or new tab
    const anchor = e.target.closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("http")) {
        e.preventDefault();
        const t = getFileType(href, "");
        if (t === "image") {
          setImagePopup({ url: href, fileName: anchor.textContent.trim() || "Image" });
        } else {
          setFileViewer({ url: href, fileName: anchor.textContent.trim() || href.split("/").pop().split("?")[0] || "Fichier", contentType: "" });
        }
      }
      return;
    }
    // Click on file container div[data-file-id] (span-based, no anchor yet)
    const fileDiv = e.target.closest("div[data-file-id]");
    if (fileDiv) {
      e.preventDefault();
      const innerAnchor = fileDiv.querySelector("a");
      if (innerAnchor) {
        const href = innerAnchor.getAttribute("href");
        const t = getFileType(href, "");
        if (t === "image") setImagePopup({ url: href, fileName: innerAnchor.textContent.trim() || "Image" });
        else setFileViewer({ url: href, fileName: innerAnchor.textContent.trim() || "Fichier", contentType: "" });
        return;
      }
      // Span-only file link — match by filename in mediaItems
      const nameSpan = fileDiv.querySelector("span:last-child");
      const name = nameSpan?.textContent?.trim();
      if (name) {
        const match = mediaItems.find(m => m.fileName === name);
        if (match) {
          const t = getFileType(match.url, match.contentType);
          if (t === "image") setImagePopup({ url: match.url, fileName: match.fileName });
          else setFileViewer({ url: match.url, fileName: match.fileName, contentType: match.contentType });
        }
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden relative">
        {/* Chapter list */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Chapitres ({chapitres.length})
            </p>
          </div>
          <div className="overflow-y-auto max-h-44">
            {chapitres.map((chap, idx) => {
              const done = isCompleted(chap.id);
              const active = isCurrent(chap.id);
              const chapMedia = extractFromContenu(chap.contenu);
              return (
                <button
                  key={chap.id}
                  onClick={() => isModerator && onSelectChapter(chap.id)}
                  disabled={!isModerator && !done && !active}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    active ? "bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500"
                    : done ? "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    : isModerator ? "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    done ? "bg-green-100 text-green-600" : active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {done ? <CheckCircle className="w-3 h-3" /> : active ? <ChevronRight className="w-3 h-3" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs truncate block ${active ? "font-semibold text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                      {chap.titre}
                    </span>
                    {chapMedia.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {chapMedia.map((m, i) => {
                          const t = getFileType(m.url, m.contentType);
                          return t === "image" ? <Image key={i} className="w-2.5 h-2.5 text-blue-400" />
                            : t === "video" ? <Video key={i} className="w-2.5 h-2.5 text-purple-400" />
                            : <FileText key={i} className="w-2.5 h-2.5 text-red-400" />;
                        })}
                      </div>
                    )}
                  </div>
                  {!isModerator && !done && !active && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current chapter content */}
        <div className="flex-1 overflow-y-auto">
          {currentChap ? (
            <div>
              <div
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 cursor-pointer"
                onClick={() => setContentExpanded(p => !p)}
              >
                <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex-1 truncate">{currentChap.titre}</h3>
                {contentExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {contentExpanded && (
                <div className="p-4 space-y-4">
                  {currentChap.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">{currentChap.description}</p>
                  )}

                  {/* Render HTML content with images and links */}
                  {processedContent && (
                    <>
                      <div
                        className="chapter-live-content text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                        onClick={handleContentClick}
                      />
                      <style>{`
                        .chapter-live-content img {
                          max-width: 100%;
                          max-height: 200px;
                          width: auto;
                          height: auto;
                          object-fit: contain;
                          border-radius: 6px;
                          border: 1px solid #e2e8f0;
                          display: block;
                          margin: 6px 0;
                          cursor: zoom-in;
                        }
                        .chapter-live-content a {
                          color: #3b82f6;
                          text-decoration: underline;
                          font-weight: 500;
                          cursor: pointer;
                        }
                        .chapter-live-content div[data-file-id] {
                          margin: 6px 0;
                          padding: 6px 10px;
                          background: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 6px;
                          display: flex;
                          align-items: center;
                          gap: 6px;
                        }
                        .chapter-live-content ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
                        .chapter-live-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
                        .chapter-live-content li { margin: 0.2em 0; }
                        .chapter-live-content p { margin: 0.4em 0; }
                      `}</style>
                    </>
                  )}

                  {/* Standalone file viewers for non-image attachments */}
                  {mediaItems.filter(m => getFileType(m.url, m.contentType) !== "image").length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fichiers joints</p>
                      {mediaItems
                        .filter(m => getFileType(m.url, m.contentType) !== "image")
                        .map((m, i) => (
                          <FileViewer key={i} url={m.url} contentType={m.contentType} fileName={m.fileName} onImageClick={(url, name) => setImagePopup({ url, fileName: name })} />
                        ))}
                    </div>
                  )}

                  {!processedContent && mediaItems.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun contenu pour ce chapitre</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
              <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Aucun chapitre sélectionné</p>
              {isModerator && (
                <p className="text-xs text-gray-400 mt-1">Cliquez sur un chapitre pour le partager avec les étudiants</p>
              )}
            </div>
          )}
        </div>

        {/* Image popup — scoped inside panel, does NOT cover the video */}
        {imagePopup && (
          <ImagePopup url={imagePopup.url} fileName={imagePopup.fileName} onClose={() => setImagePopup(null)} />
        )}

        {/* File viewer overlay inside panel */}
        {fileViewer && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{fileViewer.fileName}</span>
              <a href={fileViewer.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs">
                <ExternalLink className="w-3 h-3" /> Ouvrir
              </a>
              <button onClick={() => setFileViewer(null)} className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={getFileType(fileViewer.url, fileViewer.contentType) === "pdf"
                  ? `${fileViewer.url}#toolbar=1&navpanes=0`
                  : `https://docs.google.com/viewer?url=${encodeURIComponent(fileViewer.url)}&embedded=true`}
                className="w-full h-full border-0"
                title={fileViewer.fileName}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChapterPanel;
