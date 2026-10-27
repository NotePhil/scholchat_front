import { serverDateMillis } from "./dateUtils";

/**
 * Statut d'un événement calculé à partir de ses dates (instants UTC du serveur) — même règle que
 * le backend (EvenementStatut, renvoyé dans `statut`) : PLANIFIE avant le début, EN_COURS entre le
 * début et la fin, PASSE après la fin (sans fin : après le jour du début) ; ANNULE reste ANNULE.
 * Recalculé côté client pour qu'une carte restée affichée (ou servie par le cache du fil) bascule à
 * l'heure. L'état stocké (toujours PLANIFIE à la création) ne sert qu'en l'absence de date de début.
 */
export const computeEventStatus = (e, now = Date.now()) => {
  if (!e) return undefined;
  if (e.etat === "ANNULE" || e.statut === "ANNULE") return "ANNULE";
  const start = serverDateMillis(e.heureDebut);
  if (Number.isNaN(start)) return e.statut || e.etat || undefined;
  if (now < start) return "PLANIFIE";
  const end = serverDateMillis(e.heureFin);
  if (!Number.isNaN(end) && end >= start) return now > end ? "PASSE" : "EN_COURS";
  return new Date(now).toDateString() === new Date(start).toDateString()
    ? "EN_COURS"
    : "PASSE";
};

/** Libellé + classes Tailwind du badge de statut. */
export const EVENT_STATUS_META = {
  PLANIFIE: {
    label: "Planifié",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  EN_COURS: {
    label: "En cours",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  PASSE: {
    label: "Terminé",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
  ANNULE: {
    label: "Annulé",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};
