import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignCenter,
  faAlignJustify,
  faAlignLeft,
  faAlignRight,
  faBold,
  faCode,
  faEraser,
  faEye,
  faFile,
  faFileLines,
  faFilePdf,
  faFilm,
  faHighlighter,
  faImage,
  faIndent,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faMinus,
  faOutdent,
  faPalette,
  faPaperclip,
  faPen,
  faQuoteLeft,
  faRotateLeft,
  faRotateRight,
  faStrikethrough,
  faTable,
  faTrashCan,
  faUnderline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import RichContent from "./RichContent";
import { sanitizeRichHtml } from "./sanitizeRichHtml";
import "./richContent.css";

/**
 * Rich-text editor for course chapters (contentEditable + execCommand).
 * Output = HTML with inline styles (text-align, color, background-color,
 * font-size), semantic tags (h1-h3, ul/ol, blockquote, pre, table, a) and
 * attachment placeholders carrying data-file-id; the parent uploads the
 * pending files on save and swaps the blob: URLs for the stored ones.
 *
 * Props: value, onChange(html), placeholder,
 *        onFileAdd(fileId, file), onFileRemove(fileId), pendingFiles (Map id→File)
 */

export const COURSE_FILE_LIMITS = {
  image: { max: 10 * 1024 * 1024, label: "10 Mo" },
  video: { max: 200 * 1024 * 1024, label: "200 Mo" },
  document: { max: 50 * 1024 * 1024, label: "50 Mo" },
};
const DOC_EXTENSIONS = /\.(pdf|doc|docx|txt|ppt|pptx|xls|xlsx|odt|ods|odp|csv|rtf)$/i;
const ACCEPT =
  "image/*,video/mp4,video/webm,video/ogg,video/quicktime,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp,.csv,.rtf";

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
};

const fileCategory = (file) => {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  return "document";
};

const extOf = (name) => ((name || "").split(".").pop() || "").toUpperCase();

/** Returns an error message, or null when the file can be attached. */
export const validateCourseFile = (file) => {
  const cat = fileCategory(file);
  if (cat === "video" && !/^video\/(mp4|webm|ogg|quicktime)$/i.test(file.type)) {
    return `« ${file.name} » : format vidéo non pris en charge (MP4, WebM, OGG, MOV).`;
  }
  if (cat === "document" && !DOC_EXTENSIONS.test(file.name)) {
    return `« ${file.name} » : type de fichier non autorisé (PDF, Word, Excel, PowerPoint, texte).`;
  }
  if (file.size === 0) return `« ${file.name} » est vide.`;
  const lim = COURSE_FILE_LIMITS[cat];
  if (file.size > lim.max) {
    return `« ${file.name} » est trop volumineux (${formatFileSize(file.size)}). Taille maximale : ${lim.label}.`;
  }
  return null;
};

const TEXT_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#2563eb", "#7c3aed", "#db2777", "#64748b"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];
const SENTINEL = "rgb(1, 2, 3)"; // marks "automatic" colour so it can be removed
const BLOCKS = [
  ["p", "Paragraphe"],
  ["h1", "Titre 1"],
  ["h2", "Titre 2"],
  ["h3", "Titre 3"],
  ["blockquote", "Citation"],
  ["pre", "Code"],
];
const SIZES = [
  ["2", "Petit"],
  ["3", "Normal"],
  ["5", "Grand"],
  ["6", "Très grand"],
];
const ACTIVE_CMDS = [
  "bold", "italic", "underline", "strikeThrough", "insertUnorderedList",
  "insertOrderedList", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
];

const fileIcon = (type, name) => {
  if ((type || "").startsWith("image/")) return faImage;
  if ((type || "").startsWith("video/")) return faFilm;
  if (/pdf/i.test(type) || /\.pdf$/i.test(name)) return faFilePdf;
  if (/\.(doc|docx|txt|odt|rtf)$/i.test(name)) return faFileLines;
  return faFile;
};

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const normalizeUrl = (raw) => {
  const v = (raw || "").trim();
  if (!v) return null;
  if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null; // javascript:, data:… refused
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
};

const ToolButton = ({ icon, label, onClick, active = false, children, disabled = false }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`h-8 min-w-[2rem] px-2 inline-flex items-center justify-center gap-1 rounded text-sm transition-colors disabled:opacity-40 ${
      active
        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200"
        : "text-slate-600 hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-gray-700"
    }`}
  >
    {icon && <FontAwesomeIcon icon={icon} style={{ fontSize: 13 }} />}
    {children}
  </button>
);

const Sep = () => <span className="w-px self-stretch bg-slate-300 dark:bg-gray-600 mx-0.5" aria-hidden="true" />;

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  onFileAdd,
  onFileRemove,
  pendingFiles,
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const [active, setActive] = useState({});
  const [block, setBlock] = useState("p");
  const [popover, setPopover] = useState(null); // 'color' | 'highlight' | 'link' | 'table'
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [fileErrors, setFileErrors] = useState([]);
  const [preview, setPreview] = useState(false);
  const [attachedIds, setAttachedIds] = useState([]);

  /** Editor HTML without editor-only markers. */
  const cleanHtml = useCallback(() => {
    const el = editorRef.current;
    if (!el) return "";
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".rc-editor-selected").forEach((n) => n.classList.remove("rc-editor-selected"));
    clone.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
    clone.querySelectorAll("[class='']").forEach((n) => n.removeAttribute("class"));
    return clone.innerHTML;
  }, []);

  const collectAttachedIds = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const ids = new Set();
    el.querySelectorAll("[data-file-id]").forEach((n) => ids.add(n.getAttribute("data-file-id")));
    setAttachedIds(Array.from(ids));
  }, []);

  const emit = useCallback(() => {
    const html = cleanHtml();
    lastEmittedRef.current = html;
    onChange && onChange(html);
    collectAttachedIds();
  }, [cleanHtml, onChange, collectAttachedIds]);

  // Load external value (initial content / edit mode). Sanitized so legacy
  // chapters lose their dead image buttons while keeping their formatting.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value === lastEmittedRef.current) return;
    el.innerHTML = sanitizeRichHtml(value || "", { forEditor: true });
    el.querySelectorAll(".rc-attachment").forEach((n) => n.setAttribute("contenteditable", "false"));
    lastEmittedRef.current = value;
    collectAttachedIds();
  }, [value, collectAttachedIds]);

  const refreshActive = useCallback(() => {
    const next = {};
    ACTIVE_CMDS.forEach((c) => {
      try {
        next[c] = document.queryCommandState(c);
      } catch {
        next[c] = false;
      }
    });
    setActive(next);
    try {
      const b = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
      setBlock(BLOCKS.some(([k]) => k === b) ? b : "p");
    } catch {
      setBlock("p");
    }
  }, []);

  useEffect(() => {
    const onSel = () => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        refreshActive();
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [refreshActive]);

  const restoreSelection = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else {
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };

  const exec = (command, val = null, withCss = false) => {
    restoreSelection();
    try {
      document.execCommand("styleWithCSS", false, withCss);
    } catch {
      /* ignore */
    }
    document.execCommand(command, false, val);
    emit();
    refreshActive();
  };

  const applyColor = (kind, color) => {
    const cmd = kind === "color" ? "foreColor" : "hiliteColor";
    exec(cmd, color || SENTINEL, true);
    if (!color) {
      const prop = kind === "color" ? "color" : "backgroundColor";
      editorRef.current.querySelectorAll("[style]").forEach((n) => {
        if (n.style[prop] === SENTINEL) n.style[prop] = "";
        if (!n.getAttribute("style")) n.removeAttribute("style");
      });
      editorRef.current.querySelectorAll("font[color]").forEach((n) => {
        if ((n.getAttribute("color") || "").toLowerCase() === "#010203") n.removeAttribute("color");
      });
      emit();
    }
    setPopover(null);
  };

  const insertHtml = (html) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emit();
  };

  const insertLink = () => {
    const url = normalizeUrl(linkUrl);
    if (!url) return;
    restoreSelection();
    const sel = window.getSelection();
    const hasText = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
    if (hasText && !linkText.trim()) {
      document.execCommand("createLink", false, url);
      emit();
    } else {
      insertHtml(`<a href="${escapeHtml(url)}">${escapeHtml(linkText.trim() || url)}</a>&nbsp;`);
    }
    setPopover(null);
    setLinkUrl("");
    setLinkText("");
  };

  const insertTable = () => {
    const rows = Math.min(Math.max(Number(tableRows) || 1, 1), 30);
    const cols = Math.min(Math.max(Number(tableCols) || 1, 1), 10);
    let html = '<table style="border-collapse: collapse; width: 100%;"><tbody>';
    for (let r = 0; r < rows; r += 1) {
      html += "<tr>";
      for (let c = 0; c < cols; c += 1) {
        const tag = tableHeader && r === 0 ? "th" : "td";
        html += `<${tag}>${tableHeader && r === 0 ? `Titre ${c + 1}` : "<br>"}</${tag}>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    insertHtml(html);
    setPopover(null);
  };

  /* ── Attachments ─────────────────────────────────────────── */
  const insertNodeAtSelection = (node) => {
    const el = editorRef.current;
    restoreSelection();
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    } else {
      el.appendChild(node);
    }
  };

  const buildAttachmentNode = (file, fileId) => {
    const cat = fileCategory(file);
    const blobUrl = URL.createObjectURL(file);
    if (cat === "image") {
      const fig = document.createElement("div");
      fig.className = "rc-figure";
      fig.dataset.fileId = fileId;
      fig.style.textAlign = "center";
      const img = document.createElement("img");
      img.src = blobUrl;
      img.alt = file.name;
      img.dataset.fileId = fileId;
      fig.appendChild(img);
      return fig;
    }
    if (cat === "video") {
      const fig = document.createElement("div");
      fig.className = "rc-figure";
      fig.dataset.fileId = fileId;
      fig.style.textAlign = "center";
      const video = document.createElement("video");
      video.src = blobUrl;
      video.controls = true;
      video.preload = "metadata";
      video.dataset.fileId = fileId;
      video.style.width = "100%";
      const caption = document.createElement("div");
      caption.className = "rc-caption";
      caption.textContent = file.name;
      fig.appendChild(video);
      fig.appendChild(caption);
      return fig;
    }
    const chip = document.createElement("div");
    chip.className = "rc-attachment";
    chip.dataset.fileId = fileId;
    chip.setAttribute("contenteditable", "false");
    chip.innerHTML = `<span class="rc-attachment-icon">${/\.pdf$/i.test(file.name) ? "📕" : "📄"}</span><span class="rc-attachment-name" data-file-name="${escapeHtml(file.name)}" data-file-type="${escapeHtml(file.type)}" data-file-size="${file.size}">${escapeHtml(file.name)}</span><span class="rc-attachment-meta">${escapeHtml(extOf(file.name))} · ${escapeHtml(formatFileSize(file.size))}</span>`;
    return chip;
  };

  const addFiles = (files) => {
    const errors = [];
    files.forEach((file) => {
      const err = validateCourseFile(file);
      if (err) {
        errors.push(err);
        return;
      }
      const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const node = buildAttachmentNode(file, fileId);
      insertNodeAtSelection(node);
      if (fileCategory(file) !== "document") {
        const p = document.createElement("p");
        p.appendChild(document.createElement("br"));
        node.after(p);
      }
      onFileAdd && onFileAdd(fileId, file);
    });
    setFileErrors(errors);
    emit();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (fileId) => {
    editorRef.current
      ?.querySelectorAll(`[data-file-id="${CSS.escape(fileId)}"]`)
      .forEach((n) => (n.closest(".rc-figure, .rc-attachment") || n).remove());
    if (selectedMedia && !editorRef.current?.contains(selectedMedia)) setSelectedMedia(null);
    onFileRemove && onFileRemove(fileId);
    emit();
  };

  /* ── Selected image / video ──────────────────────────────── */
  const selectMedia = (node) => {
    editorRef.current?.querySelectorAll(".rc-editor-selected").forEach((n) => n.classList.remove("rc-editor-selected"));
    if (node) node.classList.add("rc-editor-selected");
    setSelectedMedia(node);
  };

  const mediaFigure = (media) => {
    let fig = media.closest("[data-file-id]:not(img):not(video), .rc-figure");
    if (!fig || fig === media || !editorRef.current.contains(fig)) {
      fig = document.createElement("div");
      fig.className = "rc-figure";
      media.replaceWith(fig);
      fig.appendChild(media);
    }
    return fig;
  };

  const alignMedia = (mode) => {
    if (!selectedMedia) return;
    const fig = mediaFigure(selectedMedia);
    fig.classList.add("rc-figure");
    fig.classList.remove("rc-float-left", "rc-float-right");
    ["float", "margin", "margin-left", "margin-right", "margin-bottom", "display", "position"].forEach((p) => fig.style.removeProperty(p));
    if (mode === "float-left" || mode === "float-right") {
      fig.classList.add(mode === "float-left" ? "rc-float-left" : "rc-float-right");
      fig.style.textAlign = "center";
      if (!fig.style.width) fig.style.width = "40%";
      selectedMedia.style.width = "100%";
    } else {
      fig.style.width = "";
      fig.style.textAlign = mode;
    }
    selectedMedia.style.removeProperty("max-height");
    selectedMedia.style.removeProperty("max-width");
    selectedMedia.style.removeProperty("display");
    emit();
  };

  const sizeMedia = (pct) => {
    if (!selectedMedia) return;
    const fig = mediaFigure(selectedMedia);
    selectedMedia.style.removeProperty("max-height");
    selectedMedia.style.removeProperty("max-width");
    if (fig.classList.contains("rc-float-left") || fig.classList.contains("rc-float-right")) {
      fig.style.width = pct ? `${pct}%` : "40%";
      selectedMedia.style.width = "100%";
    } else {
      selectedMedia.style.width = pct ? `${pct}%` : "";
      selectedMedia.style.removeProperty("height");
    }
    emit();
  };

  const deleteMedia = () => {
    if (!selectedMedia) return;
    const id = selectedMedia.getAttribute("data-file-id");
    const fig = selectedMedia.closest(".rc-figure, [data-file-id]:not(img):not(video)");
    (fig && editorRef.current.contains(fig) ? fig : selectedMedia).remove();
    setSelectedMedia(null);
    if (id && !editorRef.current.querySelector(`[data-file-id="${CSS.escape(id)}"]`)) {
      onFileRemove && onFileRemove(id);
    }
    emit();
  };

  /* ── Editing events ──────────────────────────────────────── */
  const handlePaste = (e) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    e.preventDefault();
    if (html) {
      // Keep the formatting of pasted text, minus scripts / embedded images / classes.
      let clean = sanitizeRichHtml(html, { forEditor: true });
      const tmp = document.createElement("div");
      tmp.innerHTML = clean;
      tmp.querySelectorAll("img[src^='data:'], img[src^='file:']").forEach((n) => n.remove());
      tmp.querySelectorAll("img[src^='blob:']:not([data-file-id])").forEach((n) => n.remove());
      tmp.querySelectorAll("[class]").forEach((n) => {
        const keep = (n.getAttribute("class") || "").split(/\s+/).filter((c) => /^rc-(figure|float-|attachment|caption)/.test(c));
        if (keep.length) n.setAttribute("class", keep.join(" "));
        else n.removeAttribute("class");
      });
      clean = tmp.innerHTML;
      document.execCommand("insertHTML", false, clean);
    } else if (text) {
      const htmlText = escapeHtml(text).replace(/\r?\n/g, "<br>");
      document.execCommand("insertHTML", false, htmlText);
    }
    emit();
  };

  const handleDrop = (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.length) return;
    e.preventDefault();
    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (range) savedRangeRef.current = range;
    addFiles(files);
  };

  const handleEditorClick = (e) => {
    e.stopPropagation();
    const media = e.target.closest?.("img, video");
    if (media && editorRef.current.contains(media)) selectMedia(media);
    else if (selectedMedia) selectMedia(null);
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Backspace" || e.key === "Delete") && selectedMedia) {
      e.preventDefault();
      deleteMedia();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      exec(e.shiftKey ? "outdent" : "indent");
    }
  };

  const pendingList = attachedIds
    .filter((id) => pendingFiles && pendingFiles.get && pendingFiles.get(id))
    .map((id) => ({ id, file: pendingFiles.get(id) }));

  const togglePopover = (name) => {
    setPopover((p) => (p === name ? null : name));
  };

  return (
    <div className="border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="relative bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 p-1.5 flex flex-wrap items-center gap-0.5 rounded-t-lg">
        <select
          aria-label="Style du paragraphe"
          title="Style du paragraphe"
          value={block}
          disabled={preview}
          onChange={(e) => exec("formatBlock", `<${e.target.value}>`)}
          className="h-8 text-sm border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 dark:text-gray-200 px-1"
        >
          {BLOCKS.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Taille du texte"
          title="Taille du texte"
          defaultValue=""
          disabled={preview}
          onChange={(e) => {
            if (e.target.value) exec("fontSize", e.target.value, true);
            e.target.value = "";
          }}
          className="h-8 text-sm border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 dark:text-gray-200 px-1"
        >
          <option value="">Taille</option>
          {SIZES.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <Sep />
        <ToolButton icon={faBold} label="Gras (Ctrl+B)" active={active.bold} disabled={preview} onClick={() => exec("bold")} />
        <ToolButton icon={faItalic} label="Italique (Ctrl+I)" active={active.italic} disabled={preview} onClick={() => exec("italic")} />
        <ToolButton icon={faUnderline} label="Souligné (Ctrl+U)" active={active.underline} disabled={preview} onClick={() => exec("underline")} />
        <ToolButton icon={faStrikethrough} label="Barré" active={active.strikeThrough} disabled={preview} onClick={() => exec("strikeThrough")} />
        <ToolButton icon={faPalette} label="Couleur du texte" active={popover === "color"} disabled={preview} onClick={() => togglePopover("color")} />
        <ToolButton icon={faHighlighter} label="Surlignage" active={popover === "highlight"} disabled={preview} onClick={() => togglePopover("highlight")} />
        <Sep />
        <ToolButton icon={faAlignLeft} label="Aligner à gauche" active={active.justifyLeft} disabled={preview} onClick={() => exec("justifyLeft")} />
        <ToolButton icon={faAlignCenter} label="Centrer" active={active.justifyCenter} disabled={preview} onClick={() => exec("justifyCenter")} />
        <ToolButton icon={faAlignRight} label="Aligner à droite" active={active.justifyRight} disabled={preview} onClick={() => exec("justifyRight")} />
        <ToolButton icon={faAlignJustify} label="Justifier" active={active.justifyFull} disabled={preview} onClick={() => exec("justifyFull")} />
        <Sep />
        <ToolButton icon={faListUl} label="Liste à puces" active={active.insertUnorderedList} disabled={preview} onClick={() => exec("insertUnorderedList")} />
        <ToolButton icon={faListOl} label="Liste numérotée" active={active.insertOrderedList} disabled={preview} onClick={() => exec("insertOrderedList")} />
        <ToolButton icon={faOutdent} label="Diminuer le retrait (Maj+Tab)" disabled={preview} onClick={() => exec("outdent")} />
        <ToolButton icon={faIndent} label="Augmenter le retrait (Tab)" disabled={preview} onClick={() => exec("indent")} />
        <Sep />
        <ToolButton icon={faQuoteLeft} label="Citation" active={block === "blockquote"} disabled={preview} onClick={() => exec("formatBlock", block === "blockquote" ? "<p>" : "<blockquote>")} />
        <ToolButton icon={faCode} label="Bloc de code" active={block === "pre"} disabled={preview} onClick={() => exec("formatBlock", block === "pre" ? "<p>" : "<pre>")} />
        <ToolButton icon={faLink} label="Insérer un lien" active={popover === "link"} disabled={preview} onClick={() => togglePopover("link")} />
        <ToolButton icon={faTable} label="Insérer un tableau" active={popover === "table"} disabled={preview} onClick={() => togglePopover("table")} />
        <ToolButton icon={faMinus} label="Ligne horizontale" disabled={preview} onClick={() => exec("insertHorizontalRule")} />
        <ToolButton
          icon={faPaperclip}
          label="Joindre des fichiers (images, vidéos, documents)"
          disabled={preview}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-xs hidden sm:inline">Fichiers</span>
        </ToolButton>
        <Sep />
        <ToolButton icon={faRotateLeft} label="Annuler (Ctrl+Z)" disabled={preview} onClick={() => exec("undo")} />
        <ToolButton icon={faRotateRight} label="Rétablir (Ctrl+Y)" disabled={preview} onClick={() => exec("redo")} />
        <ToolButton icon={faEraser} label="Effacer la mise en forme" disabled={preview} onClick={() => exec("removeFormat")} />
        <span className="flex-1" />
        <ToolButton
          icon={preview ? faPen : faEye}
          label={preview ? "Revenir à l'édition" : "Aperçu tel que vu par les élèves"}
          active={preview}
          onClick={() => {
            setPopover(null);
            selectMedia(null);
            setPreview((p) => !p);
          }}
        >
          <span className="text-xs hidden sm:inline">{preview ? "Éditer" : "Aperçu"}</span>
        </ToolButton>

        {/* Popovers */}
        {(popover === "color" || popover === "highlight") && (
          <div
            className="absolute z-20 left-1 top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
              {popover === "color" ? "Couleur du texte" : "Couleur de surlignage"}
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
              {(popover === "color" ? TEXT_COLORS : HIGHLIGHTS).map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Couleur ${c}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColor(popover, c)}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-gray-500"
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(popover, null)}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-300 hover:underline"
            >
              {popover === "color" ? "Couleur automatique" : "Aucun surlignage"}
            </button>
          </div>
        )}
        {popover === "link" && (
          <div className="absolute z-20 left-1 right-1 sm:right-auto top-full mt-1 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg sm:w-80 space-y-2">
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), insertLink())}
              placeholder="https://exemple.com"
              aria-label="Adresse du lien"
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), insertLink())}
              placeholder="Texte affiché (facultatif)"
              aria-label="Texte du lien"
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 dark:text-gray-100"
            />
            {linkUrl && !normalizeUrl(linkUrl) && (
              <p className="text-xs text-red-600">Adresse non valide (http, https ou e-mail).</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPopover(null)} className="px-2 py-1 text-xs text-slate-600 dark:text-gray-300">
                Annuler
              </button>
              <button
                type="button"
                disabled={!normalizeUrl(linkUrl)}
                onClick={insertLink}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded disabled:opacity-40"
              >
                Insérer le lien
              </button>
            </div>
          </div>
        )}
        {popover === "table" && (
          <div className="absolute z-20 left-1 top-full mt-1 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg space-y-2 text-sm dark:text-gray-200">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                Lignes
                <input type="number" min={1} max={30} value={tableRows} onChange={(e) => setTableRows(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900" />
              </label>
              <label className="flex items-center gap-1">
                Colonnes
                <input type="number" min={1} max={10} value={tableCols} onChange={(e) => setTableCols(e.target.value)} className="w-14 px-1 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900" />
              </label>
            </div>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={tableHeader} onChange={(e) => setTableHeader(e.target.checked)} />
              Ligne d'en-tête
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPopover(null)} className="px-2 py-1 text-xs text-slate-600 dark:text-gray-300">
                Annuler
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">
                Insérer le tableau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image / video options */}
      {selectedMedia && !preview && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-100">
          <span className="font-medium mr-1">{selectedMedia.tagName === "VIDEO" ? "Vidéo" : "Image"} :</span>
          <ToolButton label="Habillage à gauche (texte à droite)" onClick={() => alignMedia("float-left")}>⇤ Flottant</ToolButton>
          <ToolButton icon={faAlignLeft} label="À gauche" onClick={() => alignMedia("left")} />
          <ToolButton icon={faAlignCenter} label="Centrée" onClick={() => alignMedia("center")} />
          <ToolButton icon={faAlignRight} label="À droite" onClick={() => alignMedia("right")} />
          <ToolButton label="Habillage à droite (texte à gauche)" onClick={() => alignMedia("float-right")}>Flottant ⇥</ToolButton>
          <Sep />
          {[25, 50, 75, 100].map((p) => (
            <ToolButton key={p} label={`Largeur ${p} %`} onClick={() => sizeMedia(p)}>
              {p}%
            </ToolButton>
          ))}
          <ToolButton label="Taille d'origine" onClick={() => sizeMedia(null)}>Auto</ToolButton>
          <Sep />
          <ToolButton icon={faTrashCan} label="Supprimer" onClick={deleteMedia} />
        </div>
      )}

      {/* Pending attachments */}
      {pendingList.length > 0 && !preview && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-medium text-blue-800 dark:text-blue-200">
            <FontAwesomeIcon icon={faPaperclip} />
            {pendingList.length} fichier{pendingList.length > 1 ? "s" : ""} joint{pendingList.length > 1 ? "s" : ""} — envoyé
            {pendingList.length > 1 ? "s" : ""} à l'enregistrement du cours
          </div>
          <ul className="space-y-1">
            {pendingList.map(({ id, file }) => (
              <li key={id} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-100 dark:border-gray-700 text-sm">
                <FontAwesomeIcon icon={fileIcon(file.type, file.name)} className="text-slate-500 dark:text-gray-400 w-4" />
                <span className="truncate flex-1 min-w-0 text-slate-700 dark:text-gray-200" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400 flex-shrink-0">
                  {extOf(file.name)} · {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(id)}
                  className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                  title="Retirer ce fichier"
                  aria-label={`Retirer ${file.name}`}
                >
                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: 13 }} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fileErrors.length > 0 && (
        <div role="alert" className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300 flex gap-2">
          <ul className="flex-1 space-y-0.5">
            {fileErrors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setFileErrors([])} aria-label="Fermer" className="self-start">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {preview && (
        <div className="p-3 min-h-[150px] max-h-[60vh] overflow-y-auto text-slate-700 dark:text-gray-200">
          <RichContent html={value} emptyFallback={<p className="text-sm italic text-slate-400">Aucun contenu</p>} />
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder || "Contenu"}
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.dataTransfer?.types?.includes("Files") && e.preventDefault()}
        onClick={handleEditorClick}
        onKeyDown={handleKeyDown}
        className={`rich-content rich-content--editor w-full p-3 text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset ${preview ? "hidden" : ""}`}
        style={{ minHeight: 180, maxHeight: "60vh", overflowY: "auto" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPT}
        onChange={handleFileInputChange}
        multiple
      />
      <p className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-gray-400 border-t border-slate-100 dark:border-gray-800">
        Images ≤ {COURSE_FILE_LIMITS.image.label}, vidéos ≤ {COURSE_FILE_LIMITS.video.label}, documents ≤ {COURSE_FILE_LIMITS.document.label}. Cliquez sur une image pour l'aligner ou la redimensionner.
      </p>
    </div>
  );
};

export default RichTextEditor;
