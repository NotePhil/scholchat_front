import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCircleExclamation,
  faDownload,
  faFile,
  faFileExcel,
  faFileImage,
  faFilePdf,
  faFilePowerpoint,
  faFileVideo,
  faFileWord,
  faPaperclip,
  faPlay,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { messageService } from "../../../../services/MessageService";
import {
  ACCEPTED_ATTACHMENTS,
  MAX_ATTACHMENTS,
  attachmentPreview,
  formatFileSize,
  mediaKind,
} from "./messageMedia";

const docIcon = (media) => {
  const kind = mediaKind(media);
  if (kind === "IMAGE") return faFileImage;
  if (kind === "VIDEO") return faFileVideo;
  const name = `${media?.fileName || ""} ${media?.contentType || ""}`.toLowerCase();
  if (name.includes("pdf")) return faFilePdf;
  if (/word|\.docx?\b|opendocument\.text|\.odt/.test(name)) return faFileWord;
  if (/sheet|excel|\.xlsx?\b|\.csv|\.ods/.test(name)) return faFileExcel;
  if (/presentation|powerpoint|\.pptx?\b|\.odp/.test(name)) return faFilePowerpoint;
  return faFile;
};

/**
 * Resolves a displayable URL for a media item: presignedUrl first, else (or on
 * load error, e.g. expired) GET /media/download-by-path?filePath=.
 */
const useMediaUrl = (media) => {
  const [url, setUrl] = useState(media?.presignedUrl || null);
  const [failed, setFailed] = useState(false);
  const resolvedRef = useRef(false);

  const resolve = useCallback(async () => {
    if (resolvedRef.current || !media?.filePath) {
      setFailed(true);
      return null;
    }
    resolvedRef.current = true;
    try {
      const fresh = await messageService.resolveMediaUrl(media.filePath);
      if (fresh) {
        setUrl(fresh);
        return fresh;
      }
      setFailed(true);
    } catch (e) {
      setFailed(true);
    }
    return null;
  }, [media?.filePath]);

  useEffect(() => {
    resolvedRef.current = false;
    setFailed(false);
    setUrl(media?.presignedUrl || null);
    if (!media?.presignedUrl && media?.filePath) resolve();
  }, [media?.presignedUrl, media?.filePath, resolve]);

  return { url, failed, onError: resolve, resolve };
};

export const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Fermer"
      >
        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 22 }} />
      </button>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Télécharger"
      >
        <FontAwesomeIcon icon={faDownload} style={{ fontSize: 20 }} />
      </a>
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const ImageAttachment = ({ media, isDark }) => {
  const { url, failed, onError } = useMediaUrl(media);
  const [open, setOpen] = useState(false);
  if (failed && !url) return <DocumentAttachment media={media} isDark={isDark} />;
  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        className={`block overflow-hidden rounded-xl border ${isDark ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-100"}`}
        title={media.fileName}
      >
        {url ? (
          <img
            src={url}
            alt={media.fileName || "Photo"}
            onError={onError}
            className="w-40 h-40 object-cover hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center text-gray-400">
            <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
          </div>
        )}
      </button>
      {open && url && (
        <ImageLightbox
          src={url}
          alt={media.fileName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

const VideoAttachment = ({ media, isDark }) => {
  const { url, failed, onError } = useMediaUrl(media);
  if (failed && !url) return <DocumentAttachment media={media} isDark={isDark} />;
  return url ? (
    <video
      src={url}
      controls
      preload="metadata"
      onError={onError}
      className="max-w-full w-72 max-h-64 rounded-xl bg-black"
    />
  ) : (
    <div className="w-72 h-40 rounded-xl bg-black/80 flex items-center justify-center text-white">
      <FontAwesomeIcon icon={faPlay} />
    </div>
  );
};

const DocumentAttachment = ({ media, isDark }) => {
  const { url, resolve } = useMediaUrl(media);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const open = async () => {
    setError(false);
    let target = url;
    if (!target) {
      setBusy(true);
      target = await resolve();
      setBusy(false);
    }
    if (target) window.open(target, "_blank", "noopener,noreferrer");
    else setError(true);
  };
  return (
    <button
      type="button"
      onClick={open}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left max-w-xs ${isDark ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"}`}
      title={media.fileName}
    >
      <FontAwesomeIcon
        icon={error ? faCircleExclamation : docIcon(media)}
        className={error ? "text-red-500" : "text-blue-500"}
        style={{ fontSize: 22 }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate">
          {media.fileName || "Document"}
        </span>
        <span className="block text-xs opacity-60">
          {error ? "Fichier indisponible" : formatFileSize(media.fileSize)}
        </span>
      </span>
      <FontAwesomeIcon
        icon={busy ? faArrowsRotate : faDownload}
        className={`opacity-60 ${busy ? "animate-spin" : ""}`}
        style={{ fontSize: 14 }}
      />
    </button>
  );
};

/** Attachments of a received/sent message. */
export const MessageAttachments = ({ medias, isDark, className = "" }) => {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {medias.map((media, idx) => {
        const key = media.id || media.filePath || idx;
        const kind = mediaKind(media);
        if (kind === "IMAGE")
          return <ImageAttachment key={key} media={media} isDark={isDark} />;
        if (kind === "VIDEO")
          return <VideoAttachment key={key} media={media} isDark={isDark} />;
        return <DocumentAttachment key={key} media={media} isDark={isDark} />;
      })}
    </div>
  );
};

/** One-line list preview: text, or icon + "Photo"/"Vidéo"/"Document". */
export const MessagePreviewText = ({ contenu, medias }) => {
  const text = (contenu || "").split("--- Message original ---")[0].trim();
  const preview = attachmentPreview(medias);
  if (text) {
    return (
      <>
        {preview && (
          <FontAwesomeIcon
            icon={faPaperclip}
            className="mr-1 opacity-60"
            style={{ fontSize: 11 }}
          />
        )}
        {text}
      </>
    );
  }
  if (!preview) return null;
  const icon =
    preview.kind === "IMAGE"
      ? faFileImage
      : preview.kind === "VIDEO"
        ? faFileVideo
        : faFile;
  return (
    <span className="inline-flex items-center gap-1">
      <FontAwesomeIcon icon={icon} style={{ fontSize: 12 }} />
      {preview.label}
    </span>
  );
};

/** Paperclip button opening the file picker. */
export const AttachButton = ({
  onFiles,
  disabled,
  isDark,
  className = "",
  label,
}) => {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_ATTACHMENTS}
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={
          className ||
          `flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`
        }
        title={`Joindre des fichiers (max ${MAX_ATTACHMENTS})`}
        aria-label="Joindre des fichiers"
      >
        <FontAwesomeIcon icon={faPaperclip} style={{ fontSize: 16 }} />
        {label}
      </button>
    </>
  );
};

/** Previews of the attachments being composed (thumbnails / file chips). */
export const AttachmentPreviewList = ({ items, onRemove, onRetry, isDark }) => {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const busy = it.status === "uploading" || it.status === "pending";
        const failed = it.status === "error";
        return (
          <div
            key={it.key}
            className={`relative rounded-xl border overflow-hidden ${failed ? "border-red-400" : isDark ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-white"}`}
            title={failed ? it.error : it.file.name}
          >
            {it.previewUrl ? (
              <img
                src={it.previewUrl}
                alt={it.file.name}
                className="w-20 h-20 object-cover"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 w-52 h-20">
                <FontAwesomeIcon
                  icon={docIcon({ mediaType: it.kind, fileName: it.file.name, contentType: it.file.type })}
                  className="text-blue-500"
                  style={{ fontSize: 22 }}
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-medium truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}
                  >
                    {it.file.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {formatFileSize(it.file.size)}
                  </div>
                </div>
              </div>
            )}
            {busy && (
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${it.progress || 0}%` }}
                />
              </div>
            )}
            {failed && (
              <button
                type="button"
                onClick={() => onRetry?.(it.key)}
                className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/70 text-white text-[11px] font-semibold"
              >
                <FontAwesomeIcon icon={faArrowsRotate} />
                Réessayer
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(it.key)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              aria-label="Retirer la pièce jointe"
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
