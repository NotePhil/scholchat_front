// Offer durations (dureeMensuelleMinutes, dureeAnnuelleMinutes, delaiRappelSuppressionMinutes,
// delaiSuppressionMinutes) are stored in minutes by the API but always entered and shown in days.
export const MINUTES_PAR_JOUR = 24 * 60;

const estVide = (v) => v === "" || v === null || v === undefined;

/** Minutes -> days, rounded to at most 2 decimals (no decimals when whole). null when empty. */
export const minutesEnJours = (minutes) => {
  if (estVide(minutes) || !Number.isFinite(Number(minutes))) return null;
  return Math.round((Number(minutes) / MINUTES_PAR_JOUR) * 100) / 100;
};

/** Minutes -> string for a days input ("" when empty). */
export const minutesEnJoursSaisie = (minutes) => {
  const jours = minutesEnJours(minutes);
  return jours == null ? "" : String(jours);
};

/** Days (decimals allowed, comma or dot) -> minutes = round(days x 1440). null when empty/invalid. */
export const joursEnMinutes = (jours) => {
  if (estVide(jours)) return null;
  const n = Number(String(jours).trim().replace(",", "."));
  if (String(jours).trim() === "" || !Number.isFinite(n)) return null;
  return Math.round(n * MINUTES_PAR_JOUR);
};

/** Minutes -> "30 jours", "1 jour", "0,5 jour". "" when empty. */
export const formatDureeJours = (minutes) => {
  const jours = minutesEnJours(minutes);
  if (jours == null) return "";
  return `${jours.toLocaleString("fr-FR")} ${jours > 1 ? "jours" : "jour"}`;
};
