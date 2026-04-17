import React, { useState } from "react";
import { CheckCircle, ChevronRight, BookOpen, Lock, FileText, Image, Video, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

// Detect file type from URL or contentType
const getFileType = (url = "", contentType = "") => {
  const u = url.toLowerCase();
  if (contentType.startsWith("image/") || u.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) return "image";
  if (contentType.startsWith("video/") || u.match(/\.(mp4|webm|avi|mov|mkv)(\?|$)/)) return "video";
  if (contentType.includes("pdf") || u.match(/\.pdf(\?|$)/)) return "pdf";
  if (u.match(/\.(ppt|pptx)(\?|$)/) || contentType.includes("presentation")) return "ppt";
  if (u.match(/\.(doc|docx)(\?|$)/) || contentType.includes("word")) return "doc";
  return "file";
};

const FileViewer = ({ url, contentType = "", fileName = "Fichier" }) => {
  const type = getFileType(url, contentType);

  if (type === "image") return (
    <img src={url} alt={fileName} className="w-full rounded-lg object-contain max-h-64 bg-gray-100" />
  );

  if (type === "video") return (
    <video src={url} controls playsInline className="w-full rounded-lg max-h-64" />
  );

  if (type === "pdf") return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        className="w-full h-64"
        title={fileName}
      />
      <a href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-indigo-600 hover:underline border-t border-gray-200">
        <ExternalLink className="w-3 h-3" /> Ouvrir en plein écran
      </a>
    </div>
  );

  if (type === "ppt") return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
        className="w-full h-64"
        title={fileName}
        frameBorder="0"
      />
      <a href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-indigo-600 hover:underline border-t border-gray-200">
        <Download className="w-3 h-3" /> Télécharger le PowerPoint
      </a>
    </div>
  );

  // Generic file download
  return (
    <a href={url} target="_blank" rel="noreferrer" download={fileName}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-colors">
      <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{fileName}</span>
      <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </a>
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
