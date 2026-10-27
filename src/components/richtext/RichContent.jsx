import React, { useCallback, useEffect, useMemo, useState } from "react";
import DocumentViewer from "../viewers/DocumentViewer";
import { sanitizeRichHtml } from "./sanitizeRichHtml";
import {
  mediaRefreshKind,
  needsMediaResolution,
  resolveMediaUrl,
  resolveRichMedia,
} from "./resolveRichMedia";
import "./richContent.css";

/**
 * Single renderer for rich course content (chapter bodies…). Sanitizes the
 * stored HTML, refreshes media URLs, applies the shared typography and opens
 * images / attached files in the DocumentViewer (image lightbox, PDF viewer,
 * video player, download for other files). External links open in a new tab.
 *
 * Props:
 *  - html: stored HTML
 *  - compact: smaller type (side panels)
 *  - className: extra classes for the wrapper
 *  - onImageClick(url, alt) / onFileClick({url, fileName, contentType}):
 *    optional overrides of the built-in viewer
 *  - emptyFallback: node rendered when there is no content
 */
const isFileLink = (a) => {
  if (!a) return false;
  const href = a.getAttribute("href") || "";
  if (a.closest(".rc-attachment, [data-file-id]") || a.hasAttribute("data-file-name")) return true;
  if (/^blob:/i.test(href)) return true;
  if (/[?&]X-Amz-(Signature|Credential)=/i.test(href)) return true;
  return Boolean(mediaRefreshKind(href));
};

const fileNameFromUrl = (url) => {
  try {
    const last = new URL(url, window.location.href).pathname.split("/").pop() || "";
    return decodeURIComponent(last).replace(/^\d{10,}_/, "");
  } catch {
    return "";
  }
};

const RichContent = ({
  html,
  compact = false,
  className = "",
  style,
  onImageClick,
  onFileClick,
  emptyFallback = null,
}) => {
  const sanitized = useMemo(() => sanitizeRichHtml(html || ""), [html]);
  const [resolved, setResolved] = useState(() =>
    needsMediaResolution(sanitized) ? null : sanitized,
  );
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!needsMediaResolution(sanitized)) {
      setResolved(sanitized);
      return undefined;
    }
    setResolved(null);
    resolveRichMedia(sanitized)
      .then((out) => alive && setResolved(out))
      .catch(() => alive && setResolved(sanitized));
    return () => {
      alive = false;
    };
  }, [sanitized]);

  const handleClick = useCallback(
    async (e) => {
      const img = e.target.closest?.("img");
      const anchor = e.target.closest?.("a");
      if (img && !anchor) {
        const url = img.getAttribute("src");
        if (!url) return;
        e.preventDefault();
        const name = img.getAttribute("alt") || "Image";
        if (onImageClick) onImageClick(url, name);
        else setViewer({ url, fileName: name, contentType: "image" });
        return;
      }
      if (!anchor || !isFileLink(anchor)) return; // external link: new tab
      e.preventDefault();
      const href = anchor.getAttribute("href");
      if (!href) return;
      const url = await resolveMediaUrl(href);
      const fileName =
        anchor.getAttribute("data-file-name") ||
        anchor.textContent.trim() ||
        fileNameFromUrl(url) ||
        "Document";
      const contentType = anchor.getAttribute("data-file-type") || "";
      if (onFileClick) onFileClick({ url, fileName, contentType });
      else setViewer({ url, fileName, contentType });
    },
    [onImageClick, onFileClick],
  );

  if (!sanitized) return emptyFallback;

  const classes = `rich-content${compact ? " rich-content--compact" : ""}${className ? ` ${className}` : ""}`;
  return (
    <>
      {resolved === null ? (
        <div className={classes} style={style} aria-busy="true">
          <div className="animate-pulse space-y-2" aria-label="Chargement du contenu">
            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      ) : (
        <div
          className={classes}
          style={style}
          onClick={handleClick}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: resolved }}
        />
      )}
      {viewer && (
        <DocumentViewer
          isOpen
          url={viewer.url}
          fileName={viewer.fileName}
          contentType={viewer.contentType}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
};

export default RichContent;
