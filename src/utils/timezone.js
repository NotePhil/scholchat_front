/**
 * Client time-zone propagation.
 *
 * The backend interprets any naive (offset-less) date-time it receives in the
 * zone given by the `X-Timezone` request header (IANA name), else UTC. This
 * module makes sure EVERY request to the ScholChat backend carries that header:
 *   - a request interceptor on the default axios instance,
 *   - a wrapper around axios.create so every instance created afterwards gets it,
 *   - a window.fetch wrapper.
 *
 * It must be imported FIRST in src/index.js (before App) so that it runs
 * before services create their axios instances at import time.
 *
 * The header is only added to requests going to our backend: never to
 * S3/MinIO presigned URLs or third-party hosts (a custom header there would
 * trigger a CORS preflight that those hosts reject).
 */
import axios from "axios";

export const TIMEZONE_HEADER = "X-Timezone";

export const getClientTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (e) {
    return "UTC";
  }
};

const currentOrigin = () =>
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "http://localhost";

const resolveUrl = (url, base) => {
  try {
    return new URL(url, base || currentOrigin());
  } catch (e) {
    return null;
  }
};

// Normalised API base, e.g. "http://localhost:8486/scholchat" (no trailing slash).
const API_BASE = (() => {
  const raw = process.env.REACT_APP_API_BASE_URL;
  if (!raw) return null;
  const u = resolveUrl(raw);
  if (!u) return null;
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
})();

/**
 * True if the (absolute or relative) URL targets the ScholChat backend.
 */
export const isBackendUrl = (url, baseURL) => {
  if (!url && !baseURL) return false;
  const str = String(url || "");
  if (/^(blob|data):/i.test(str)) return false;

  let resolved;
  if (baseURL && !/^[a-z][a-z\d+\-.]*:\/\//i.test(str)) {
    // axios-style combination: baseURL + relative url
    const joined = `${String(baseURL).replace(/\/+$/, "")}/${str.replace(/^\/+/, "")}`;
    resolved = resolveUrl(str ? joined : baseURL);
  } else {
    resolved = resolveUrl(str);
  }
  if (!resolved) return false;

  // Presigned S3/MinIO URLs: never touch them.
  if (/[?&]X-Amz-/i.test(resolved.search)) return false;

  const full = `${resolved.origin}${resolved.pathname}`;
  if (API_BASE && (full === API_BASE || full.startsWith(`${API_BASE}/`))) {
    return true;
  }
  // Same-origin requests to a "/scholchat" path (e.g. reverse-proxied API).
  return (
    resolved.origin === currentOrigin() &&
    /^\/scholchat(\/|$)/.test(resolved.pathname)
  );
};

const timezoneRequestInterceptor = (config) => {
  try {
    if (isBackendUrl(config.url, config.baseURL)) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set(TIMEZONE_HEADER, getClientTimeZone());
      } else {
        config.headers = {
          ...(config.headers || {}),
          [TIMEZONE_HEADER]: getClientTimeZone(),
        };
      }
    }
  } catch (e) {
    // never block a request because of the time-zone header
  }
  return config;
};

const MARK = "__scholchatTimezoneInterceptor";

/** Install the X-Timezone interceptor on an axios instance (idempotent). */
export const applyTimezoneInterceptor = (instance) => {
  if (!instance || !instance.interceptors || instance[MARK]) return instance;
  instance.interceptors.request.use(timezoneRequestInterceptor);
  try {
    Object.defineProperty(instance, MARK, { value: true, enumerable: false });
  } catch (e) {
    instance[MARK] = true;
  }
  return instance;
};

const installAxios = () => {
  applyTimezoneInterceptor(axios);
  if (axios.create && !axios.create[MARK]) {
    const originalCreate = axios.create.bind(axios);
    const wrappedCreate = function (...args) {
      return applyTimezoneInterceptor(originalCreate(...args));
    };
    wrappedCreate[MARK] = true;
    axios.create = wrappedCreate;
  }
};

const installFetch = () => {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.fetch[MARK]) return;
  const originalFetch = window.fetch.bind(window);

  const wrappedFetch = function (input, init) {
    try {
      const isRequest =
        typeof Request !== "undefined" && input instanceof Request;
      const url = isRequest ? input.url : input instanceof URL ? input.href : input;
      if (typeof url === "string" && isBackendUrl(url)) {
        const opts = { ...(init || {}) };
        const headers = new Headers(
          opts.headers || (isRequest ? input.headers : undefined)
        );
        if (!headers.has(TIMEZONE_HEADER)) {
          headers.set(TIMEZONE_HEADER, getClientTimeZone());
        }
        opts.headers = headers;
        return originalFetch(input, opts);
      }
    } catch (e) {
      // fall through to the untouched call
    }
    return originalFetch(input, init);
  };
  wrappedFetch[MARK] = true;
  window.fetch = wrappedFetch;
};

// REACT_APP_SEND_TIMEZONE_HEADER=false turns the header off (set in .env.production while
// the deployed backend predates X-Timezone and rejects it in CORS preflights). Dates are
// still sent as ISO strings with their offset, so only naive date-times lose the zone.
if (process.env.REACT_APP_SEND_TIMEZONE_HEADER !== "false") {
  installAxios();
  installFetch();
}
