const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// Minutes east of UTC for the zone abbreviations java.util.Date#toString() can emit.
const TZ_OFFSETS = {
  UTC: 0, GMT: 0, Z: 0, WET: 0, WAT: 60, CET: 60, BST: 60, CEST: 120, CAT: 120, EET: 120, SAST: 120,
  EEST: 180, EAT: 180, EST: -300, EDT: -240, CST: -360, CDT: -300, MST: -420, MDT: -360, PST: -480, PDT: -420,
};

const JAVA_DATE_RE =
  /^[A-Za-z]{3} ([A-Za-z]{3}) (\d{1,2}) (\d{2}):(\d{2}):(\d{2}) ([A-Za-z]+) (\d{4})$/;

/**
 * Older messages were stored with java.util.Date#toString()
 * ("Mon Oct 05 12:00:00 WAT 2026"), which Firefox/Safari (and Chrome for most
 * zone names) parse as Invalid Date — breaking list dates and sort order.
 * New messages carry ISO-8601 dates.
 */
export const parseMessageDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const m = raw.match(JAVA_DATE_RE);
  if (m) {
    const [, mon, day, hh, mm, ss, tz, year] = m;
    const month = MONTHS[mon];
    if (month === undefined) return null;
    const offset = TZ_OFFSETS[tz.toUpperCase()];
    if (offset !== undefined) {
      return new Date(Date.UTC(+year, month, +day, +hh, +mm, +ss) - offset * 60000);
    }
    return new Date(+year, month, +day, +hh, +mm, +ss);
  }
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? raw.replace(" ", "T") : raw;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const dateMs = (value) => parseMessageDate(value)?.getTime() ?? 0;

/** Utilisateurs payload for POST /messages — the backend rejects null nom/prenom (@NonNull). */
export const toUtilisateurPayload = (user) => ({
  type: "utilisateur",
  id: user.id,
  nom: user.nom || "",
  prenom: user.prenom || "",
  email: user.email || "",
});
