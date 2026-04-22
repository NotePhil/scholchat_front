import React, { useState } from "react";
import { CheckCircle, ChevronRight, BookOpen, Lock, FileText, Image, Video, Download, ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

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
  image:  { color: "bg-green-100 text-green-600",label: "Image" },
  video:  { color: "bg-purple-100 text-purple-600", label: "Vidéo" },
  file:   { color: "bg-gray-100 text-gray-600",  label: "Fichier" },
};

const FileViewer = ({ url, contentType = "", fileName = "Fichier" }) => {
  const [preview, setPreview] = useState(false);
  const type = getFileType(url, contentType);
  const meta = FILE_META[type] || FILE_META.file;

  // Google Docs viewer works for pdf, doc, docx, xls, xlsx, ppt, pptx
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const canPreview = type === "image" || type === "video" || type === "pdf" || type === "office";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* File header row */}
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
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download={fileName}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Preview area */}
      {preview && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {type === "image" && (
            <img src={url} alt={fileName} className="w-full object-contain max-h-80" />
          )}
          {type === "video" && (
            <video src={url} controls playsInline className="w-full max-h-64" />
          )}
          {(type === "pdf" || type === "office") && (
            <div className="relative">
              <iframe
                src={type === "pdf" ? `${url}#toolbar=1&navpanes=0` : googleViewerUrl}
                className="w-full"
                style={{ height: "420px" }}
                title={fileName}
                frameBorder="0"
                allow="autoplay"
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-indigo-600 hover:underline border-t border-gray-200"
              >
                <ExternalLink className="w-3 h-3" /> Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Extract all media/files from a chapitre object
const extractChapterMedia = (chap) => {
  const media = [];

  // Direct fileUrl on chapter
  if (chap.fileUrl) {
    media.push({ url: chap.fileUrl, contentType: "", fileName: chap.titre || "Fichier" });
  }

  // imageUrl field
  if (chap.imageUrl) {
    media.push({ url: chap.imageUrl, contentType: "image/", fileName: "Image" });
  }

  // medias array (from backend)
  if (Array.isArray(chap.medias)) {
    chap.medias.forEach(m => {
      const url = m.filePath || m.fileUrl || m.url || "";
      if (url) media.push({ url, contentType: m.contentType || "", fileName: m.fileName || m.titre || "Fichier" });
    });
  }

  // ressources array
  if (Array.isArray(chap.ressources)) {
    chap.ressources.forEach(r => {
      const url = r.filePath || r.fileUrl || r.url || "";
      if (url) media.push({ url, contentType: r.contentType || "", fileName: r.fileName || r.nom || "Ressource" });
    });
  }

  return media;
};

const ChapterPanel = ({ chapitres = [], currentChapitreId, progress = [], isModerator, onSelectChapter }) => {
  const [contentExpanded, setContentExpanded] = useState(true);
  const isCompleted = (chapId) => progress.some(p => p.chapitreId === chapId && p.completed);
  const isCurrent = (chapId) => chapId === currentChapitreId;
  const currentChap = chapitres.find(c => c.id === currentChapitreId);
  const mediaItems = currentChap ? extractChapterMedia(currentChap) : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
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
            const chapMedia = extractChapterMedia(chap);
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
                  {/* File type indicators */}
                  {chapMedia.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {chapMedia.map((m, i) => {
                        const t = getFileType(m.url, m.contentType);
                        return t === "image" ? <Image key={i} className="w-2.5 h-2.5 text-blue-400" />
                          : t === "video" ? <Video key={i} className="w-2.5 h-2.5 text-purple-400" />
                          : t === "pdf" ? <FileText key={i} className="w-2.5 h-2.5 text-red-400" />
                          : t === "ppt" ? <FileText key={i} className="w-2.5 h-2.5 text-orange-400" />
                          : <FileText key={i} className="w-2.5 h-2.5 text-gray-400" />;
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
            {/* Chapter header */}
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
                {/* Description */}
                {currentChap.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">{currentChap.description}</p>
                )}

                {/* All media files */}
                {mediaItems.length > 0 && (
                  <div className="space-y-3">
                    {mediaItems.map((m, i) => (
                      <FileViewer key={i} url={m.url} contentType={m.contentType} fileName={m.fileName} />
                    ))}
                  </div>
                )}

                {/* Text content */}
                {currentChap.contenu && (
                  <div
                    className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: currentChap.contenu }}
                  />
                )}

                {!currentChap.contenu && mediaItems.length === 0 && (
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
    </div>
  );
};

export default ChapterPanel;
