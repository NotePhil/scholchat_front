import axios from "axios";

/**
 * Makes the media referenced by stored rich HTML loadable by plain <img>,
 * <video> and <a> elements (which cannot send the Authorization header):
 *  - backend proxy URLs  …/media/{id}/content  → fresh presigned URL
 *    (GET /media/{id}/download-url)
 *  - expired / soon-expiring presigned storage URLs (X-Amz-*) or bare storage
 *    URLs (…/users/{owner}/…) → fresh presigned URL
 *    (GET /media/download-by-path)
 * Everything else (external links, blob:, data:, still-valid presigned URLs)
 * is left untouched. Results are cached for 40 minutes.
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";
const TTL_MS = 40 * 60 * 1000;
const cache = new Map(); // key -> { url, fileName, contentType, at }

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PROXY_RE = /\/media\/([A-Za-z0-9-]+)\/content(?:[?#].*)?$/;

const decodeEntities = (url) => (url || "").replace(/&amp;/g, "&");

/** Storage key (users/… or bucket-relative path) of a direct storage URL. */
export const storagePathOf = (raw) => {
  try {
    const { pathname } = new URL(raw);
    const p = decodeURIComponent(pathname.replace(/^\//, ""));
    const idx = p.indexOf("users/");
    if (idx >= 0) return p.slice(idx);
    const parts = p.split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : p;
  } catch {
    return null;
  }
};

const presignedRemainingMs = (url) => {
  try {
    const u = new URL(url);
    const date = u.searchParams.get("X-Amz-Date");
    const expires = Number(u.searchParams.get("X-Amz-Expires"));
    if (!date || !expires) return null;
    const m = date.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    const start = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    return start + expires * 1000 - Date.now();
  } catch {
    return null;
  }
};

/** What kind of refresh a URL needs: "proxy" | "path" | null. */
export const mediaRefreshKind = (rawUrl) => {
  const url = decodeEntities(rawUrl);
  if (!url || /^(blob:|data:|mailto:|tel:|#)/i.test(url)) return null;
  if (PROXY_RE.test(url) && (url.startsWith("/") || (API_BASE && url.startsWith(API_BASE)))) return "proxy";
  if (!/^https?:/i.test(url)) return null;
  if (API_BASE && url.startsWith(API_BASE)) return null;
  if (/[?&]X-Amz-(Signature|Credential)=/i.test(url)) {
    const left = presignedRemainingMs(url);
    return left !== null && left > 5 * 60 * 1000 ? null : "path";
  }
  return /\/users\/[^/]+\/(image|video|document|audio)\//i.test(url) ? "path" : null;
};

const fetchFresh = async (rawUrl) => {
  const url = decodeEntities(rawUrl);
  const kind = mediaRefreshKind(url);
  if (!kind) return null;
  const key = kind === "proxy" ? `id:${url.match(PROXY_RE)[1]}` : `path:${storagePathOf(url)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit;
  let data;
  if (kind === "proxy") {
    ({ data } = await api.get(`/media/${url.match(PROXY_RE)[1]}/download-url`));
  } else {
    const path = storagePathOf(url);
    if (!path) return null;
    ({ data } = await api.get(`/media/download-by-path`, { params: { filePath: path } }));
  }
  if (!data?.url) return null;
  const entry = { url: data.url, fileName: data.fileName, contentType: data.contentType, at: Date.now() };
  cache.set(key, entry);
  return entry;
};

/** Resolves one URL (used by click handlers); returns the original when nothing to do / on error. */
export const resolveMediaUrl = async (url) => {
  try {
    const fresh = await fetchFresh(url);
    return fresh?.url || decodeEntities(url);
  } catch {
    return decodeEntities(url);
  }
};

/** True when sanitized HTML references media that must be resolved before display. */
export const needsMediaResolution = (html) => {
  if (!html) return false;
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (mediaRefreshKind(m[1])) return true;
  }
  return false;
};

/**
 * Returns the HTML with every resolvable media URL replaced. Also stores the
 * real file name / content type on links (data-file-name / data-file-type) so
 * the viewer can pick the right preview.
 */
export const resolveRichMedia = async (html) => {
  if (!needsMediaResolution(html)) return html;
  const doc = new DOMParser().parseFromString(`<div id="rc-root">${html}</div>`, "text/html");
  const root = doc.getElementById("rc-root");
  const jobs = [];
  root.querySelectorAll("img[src], video[src], audio[src], source[src], a[href]").forEach((el) => {
    const attr = el.tagName === "A" ? "href" : "src";
    const val = el.getAttribute(attr);
    if (!mediaRefreshKind(val)) return;
    jobs.push(
      fetchFresh(val)
        .then((fresh) => {
          if (!fresh) return;
          el.setAttribute(attr, fresh.url);
          if (el.tagName === "A") {
            if (fresh.fileName && !el.getAttribute("data-file-name")) el.setAttribute("data-file-name", fresh.fileName);
            if (fresh.contentType && !el.getAttribute("data-file-type")) el.setAttribute("data-file-type", fresh.contentType);
          }
        })
        .catch(() => {}),
    );
  });
  await Promise.all(jobs);
  return root.innerHTML;
};
