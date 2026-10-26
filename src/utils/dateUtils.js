/**
 * Shared date/time helpers.
 *
 * Server contract:
 *  - every date-time in API responses is an ISO-8601 UTC instant
 *    ("2026-10-05T11:00:00.000Z");
 *  - pure dates (LocalDate) are "yyyy-MM-dd";
 *  - date-times sent to the server must carry an offset → use toServerDateTime().
 *
 * Display always happens in the browser's local time zone.
 */

const pad2 = (n) => String(n).padStart(2, "0");

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
// Naive (offset-less) ISO-like local date-time: "YYYY-MM-DD[T ]HH:mm[:ss[.fff...]]"
const NAIVE_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
// Has an explicit offset or Z at the end
const OFFSET_RE = /(Z|[+-]\d{2}:?\d{2})$/i;

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

/**
 * Parse a value coming from the server (or anywhere) into a Date.
 * - Date → copy; number → epoch millis
 * - ISO with Z/offset → exact instant
 * - "YYYY-MM-DD" (pure date) → LOCAL midnight (avoids off-by-one-day display)
 * - legacy naive "YYYY-MM-DDTHH:mm[:ss[.ffffff]]" → interpreted as local time
 * - anything else (e.g. legacy Java Date#toString) → native Date parsing
 * Returns null when the value is empty or unparseable.
 */
export const parseServerDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isValidDate(value) ? new Date(value.getTime()) : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValidDate(d) ? d : null;
  }
  if (Array.isArray(value)) {
    // Jackson array form [y, m, d, h, min, s, nanos]
    const [y, m = 1, d = 1, h = 0, mi = 0, s = 0, ns = 0] = value;
    const date = new Date(y, m - 1, d, h, mi, s, Math.floor(ns / 1e6));
    return isValidDate(date) ? date : null;
  }
  const str = String(value).trim();
  if (!str) return null;

  let m = DATE_ONLY_RE.exec(str);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isValidDate(d) ? d : null;
  }

  if (!OFFSET_RE.test(str)) {
    m = NAIVE_RE.exec(str);
    if (m) {
      const ms = m[7] ? Number(m[7].slice(0, 3).padEnd(3, "0")) : 0;
      const d = new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        m[6] ? Number(m[6]) : 0,
        ms
      );
      return isValidDate(d) ? d : null;
    }
  }

  // ISO with offset: trim sub-millisecond precision, which some engines reject.
  const normalized = str.replace(/(\.\d{3})\d+(?=(Z|[+-]\d{2}:?\d{2})$)/i, "$1");
  const d = new Date(normalized);
  return isValidDate(d) ? d : null;
};

/** "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">. "" if empty. */
export const toLocalInputValue = (value) => {
  const d = parseServerDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
};

/** "YYYY-MM-DD" in local time, for <input type="date"> and LocalDate fields. "" if empty. */
export const toLocalDateInputValue = (value) => {
  const d = parseServerDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** "HH:mm" in local time, for <input type="time">. "" if empty. */
export const toLocalTimeInputValue = (value) => {
  const d = parseServerDate(value);
  if (!d) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/**
 * Convert a local datetime-local value ("YYYY-MM-DDTHH:mm"), a Date, a dayjs/moment
 * object or a server string into an ISO-8601 UTC instant for the server.
 * Returns undefined for undefined (so the field stays omitted from JSON payloads),
 * null when the value is null/empty or invalid.
 */
export const toServerDateTime = (value) => {
  if (value === undefined) return undefined;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if (typeof value.toDate === "function") value = value.toDate();
  }
  const d = parseServerDate(value);
  return d ? d.toISOString() : null;
};

/** Combine a local "YYYY-MM-DD" date and "HH:mm" time into a server ISO instant. */
export const combineLocalDateTime = (dateStr, timeStr = "00:00") =>
  dateStr ? toServerDateTime(`${dateStr}T${timeStr || "00:00"}`) : null;

/** Local "dd/mm/yyyy"-style date (fr-FR by default). "" if empty. */
export const formatLocalDate = (value, locale = "fr-FR", options) => {
  const d = parseServerDate(value);
  if (!d) return "";
  return d.toLocaleDateString(
    locale,
    options || { day: "2-digit", month: "2-digit", year: "numeric" }
  );
};

/** Local date + time. "" if empty. */
export const formatLocalDateTime = (value, locale = "fr-FR", options) => {
  const d = parseServerDate(value);
  if (!d) return "";
  return d.toLocaleString(
    locale,
    options || {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

/** Local "HH:mm". "" if empty. */
export const formatLocalTime = (value, locale = "fr-FR") => {
  const d = parseServerDate(value);
  if (!d) return "";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

/** Epoch millis of a server value, or NaN — handy for sorting/comparisons. */
export const serverDateMillis = (value) => {
  const d = parseServerDate(value);
  return d ? d.getTime() : NaN;
};

/** Today as a local "YYYY-MM-DD" (instead of new Date().toISOString().slice(0,10)). */
export const todayLocalDate = () => toLocalDateInputValue(new Date());
