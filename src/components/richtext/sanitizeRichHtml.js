/**
 * Allowlist sanitizer for the HTML produced by the course rich-text editor
 * (contentEditable + document.execCommand). Keeps every formatting the editor
 * can produce — bold/italic/underline/strike, headings, font size/colour/
 * highlight (inline styles or <font>), alignment (text-align / align),
 * indentation, lists, blockquotes, code, links, images, videos, tables — and
 * drops scripts, event handlers, forms, iframes, javascript: URLs and the
 * editor-only controls (image float buttons) older chapters were saved with.
 *
 * Used both when DISPLAYING (RichContent) and when loading/saving in the
 * editor, so what the professor sees is exactly what learners see.
 */

const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
  "form", "input", "button", "select", "option", "textarea", "label", "link",
  "meta", "base", "noscript", "template", "svg", "math", "canvas", "dialog",
  "title", "head",
]);

const ALLOWED_TAGS = new Set([
  "p", "div", "span", "br", "b", "strong", "i", "em", "u", "s", "strike", "del",
  "ins", "sub", "sup", "mark", "small", "big", "font", "h1", "h2", "h3", "h4",
  "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "hr", "a", "img",
  "video", "audio", "source", "table", "thead", "tbody", "tfoot", "tr", "th",
  "td", "caption", "colgroup", "col", "figure", "figcaption", "center",
]);

const GLOBAL_ATTRS = new Set(["style", "class", "title", "dir", "align", "data-file-id", "data-file-name", "data-file-size", "data-file-type"]);
const TAG_ATTRS = {
  a: ["href", "target", "rel", "download"],
  img: ["src", "alt", "width", "height"],
  video: ["src", "controls", "poster", "width", "height", "preload", "playsinline"],
  audio: ["src", "controls", "preload"],
  source: ["src", "type"],
  font: ["color", "face", "size"],
  ol: ["start", "type", "reversed"],
  ul: ["type"],
  td: ["colspan", "rowspan", "width", "valign"],
  th: ["colspan", "rowspan", "width", "valign", "scope"],
  col: ["span", "width"],
  colgroup: ["span"],
  table: ["width", "border", "cellpadding", "cellspacing"],
};

const ALLOWED_STYLE_PROPS = new Set([
  "color", "background-color", "background", "text-align", "text-decoration",
  "text-decoration-line", "text-indent", "font-weight", "font-style",
  "font-size", "font-family", "line-height", "letter-spacing", "vertical-align",
  "white-space", "margin", "margin-left", "margin-right", "margin-top",
  "margin-bottom", "padding", "padding-left", "padding-right", "padding-top",
  "padding-bottom", "float", "clear", "display", "width", "max-width",
  "min-width", "height", "max-height", "border", "border-top", "border-bottom",
  "border-left", "border-right", "border-color", "border-style", "border-width",
  "border-radius", "border-collapse", "list-style-type", "object-fit",
  "box-shadow", "gap", "align-items", "justify-content", "flex-wrap",
]);

const SAFE_DISPLAY = new Set(["block", "inline", "inline-block", "flex", "inline-flex", "table", "table-cell", "table-row", "list-item", "none"]);
// Stops a style from escaping the content box (overlays, clickjacking).
const BAD_STYLE_VALUE = /url\s*\(|expression\s*\(|javascript:|vbscript:|@import|behaviou?r\s*:|-moz-binding/i;

const CLASS_ALLOWED = /^(ql-|rc-)/;

const isSafeHref = (url) => {
  const v = (url || "").trim();
  if (!v) return false;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return true;
  if (/^[#/?.]/.test(v)) return true; // relative / anchor
  return !/^[a-z][a-z0-9+.-]*:/i.test(v); // no other scheme
};

const isSafeSrc = (url) => {
  const v = (url || "").trim();
  if (!v) return false;
  if (/^(https?:|blob:)/i.test(v)) return true;
  if (/^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i.test(v)) return true;
  if (/^\//.test(v)) return true; // same-origin relative (e.g. /media/{id}/content)
  return false;
};

export const sanitizeStyle = (styleText) => {
  if (!styleText) return "";
  const out = [];
  styleText.split(";").forEach((decl) => {
    const idx = decl.indexOf(":");
    if (idx < 0) return;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value || !ALLOWED_STYLE_PROPS.has(prop)) return;
    if (BAD_STYLE_VALUE.test(value)) return;
    if (prop === "display" && !SAFE_DISPLAY.has(value.toLowerCase().replace(/\s*!important/, ""))) return;
    out.push(`${prop}: ${value}`);
  });
  return out.join("; ");
};

const cleanAttributes = (el, tag) => {
  const allowed = TAG_ATTRS[tag] || [];
  Array.from(el.attributes).forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (!GLOBAL_ATTRS.has(name) && !allowed.includes(name)) {
      el.removeAttribute(attr.name);
      return;
    }
    if (name === "style") {
      const s = sanitizeStyle(attr.value);
      if (s) el.setAttribute("style", s);
      else el.removeAttribute("style");
    } else if (name === "class") {
      const cls = attr.value.split(/\s+/).filter((c) => CLASS_ALLOWED.test(c));
      if (cls.length) el.setAttribute("class", cls.join(" "));
      else el.removeAttribute("class");
    } else if (name === "href" && !isSafeHref(attr.value)) {
      el.removeAttribute("href");
    } else if (name === "src" && !isSafeSrc(attr.value)) {
      el.removeAttribute("src");
    } else if (name === "color" && BAD_STYLE_VALUE.test(attr.value)) {
      el.removeAttribute("color");
    }
  });
};

const walk = (node, doc) => {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 8) {
      child.remove(); // comments
      return;
    }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) {
      child.remove();
      return;
    }
    walk(child, doc);
    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown element: keep its (already cleaned) children only.
      const frag = doc.createDocumentFragment();
      while (child.firstChild) frag.appendChild(child.firstChild);
      child.replaceWith(frag);
      return;
    }
    cleanAttributes(child, tag);
  });
};

/** Removes the editor-only wrapper chrome (empty control bars left after dropping buttons). */
const stripEditorChrome = (root) => {
  root.querySelectorAll("[data-file-id] > div, [data-file-id] > span").forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector("img,video,audio,a")) el.remove();
  });
};

const decorate = (root, doc, { forEditor }) => {
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (/^(https?:)?\/\//i.test(href) || /^\//.test(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    } else {
      a.removeAttribute("target");
    }
  });
  if (forEditor) return;
  root.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
  root.querySelectorAll("video").forEach((v) => {
    v.setAttribute("controls", "");
    v.setAttribute("playsinline", "");
    if (!v.getAttribute("preload")) v.setAttribute("preload", "metadata");
  });
  // Tables scroll horizontally on narrow screens instead of overflowing.
  root.querySelectorAll("table").forEach((t) => {
    if (t.parentElement?.classList.contains("rc-table-wrap")) return;
    const wrap = doc.createElement("div");
    wrap.className = "rc-table-wrap";
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });
};

/**
 * @param {string} html raw HTML
 * @param {{forEditor?: boolean}} opts forEditor: skip display-only decoration
 *   (lazy images, table scroll wrappers) so saved HTML stays clean.
 */
export const sanitizeRichHtml = (html, opts = {}) => {
  if (!html || typeof html !== "string") return "";
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(
    `<!doctype html><html><body><div id="rc-root">${html}</div></body></html>`,
    "text/html",
  );
  const root = doc.getElementById("rc-root");
  if (!root) return "";
  walk(root, doc);
  stripEditorChrome(root);
  if (opts.forEditor) {
    // Unwrap previously added display wrappers if any slipped into stored HTML.
    root.querySelectorAll("div.rc-table-wrap").forEach((w) => {
      const frag = doc.createDocumentFragment();
      while (w.firstChild) frag.appendChild(w.firstChild);
      w.replaceWith(frag);
    });
  }
  decorate(root, doc, opts);
  return root.innerHTML;
};

/** Plain text of rich HTML (for previews / emptiness checks). */
export const richHtmlToText = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  return (doc.body.textContent || "").replace(/ /g, " ");
};

/** True when the HTML has no visible text and no media/table. */
export const isRichHtmlEmpty = (html) => {
  if (!html) return true;
  if (/<(img|video|audio|table|hr)\b/i.test(html)) return false;
  if (/data-file-id=/i.test(html)) return false;
  return !richHtmlToText(html).trim();
};

export default sanitizeRichHtml;
