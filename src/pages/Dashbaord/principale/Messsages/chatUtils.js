import { dateMs, parseMessageDate } from "./messageUtils";

/**
 * These helpers are plain functions (no hooks): callers pass the `t` function
 * from useTranslation() and, for dates, the current `language` ("fr" | "en").
 * Without `t` the French defaults are used.
 */
export const defaultT = (key, fallback, params = {}) =>
  String(fallback ?? key)
    .replace(/\{\{(\w+)\}\}/g, (m, k) => (params[k] !== undefined ? params[k] : m))
    .replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));

/** BCP 47 locale for toLocale*String from the app language. */
export const dateLocale = (language) => (language === "en" ? "en-US" : "fr-FR");

export const attachmentLabel = (t = defaultT) =>
  t("messaging.common.attachmentLabel", "📎 Pièce jointe");
export const deletedLabel = (t = defaultT) =>
  t("messaging.common.deletedMessage", "Ce message a été supprimé");

export const fullName = (u, t = defaultT) =>
  `${u?.prenom || ""} ${u?.nom || ""}`.trim() ||
  t("messaging.common.user", "Utilisateur");

export const initialsOf = (u) => {
  const a = (u?.prenom || "").trim()[0] || "";
  const b = (u?.nom || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

export const otherParticipants = (conv, myId) =>
  (conv?.participants || []).filter((p) => p.id !== myId);

export const isGroup = (conv) => conv?.type === "GROUPE";

/** Conversation of a message sent to a class ("Message à une classe"). */
export const isClassConversation = (conv) =>
  conv?.categorie === "CLASSE" || (isGroup(conv) && !!conv?.classeId);

/** Conversation started by a general message (sent to several classes). */
export const isGeneralBroadcast = (conv) => conv?.categorie === "GENERAL";

// ── List filters (same labels and rules as the mobile app) ─────────────────
// `label` is the French default; translate with t(f.labelKey, f.label).
export const CONVERSATION_FILTERS = [
  { id: "all", labelKey: "messaging.filters.all", label: "Tous" },
  { id: "unread", labelKey: "messaging.filters.unread", label: "Non lus" },
  { id: "favorites", labelKey: "messaging.filters.favorites", label: "Favoris" },
  { id: "general", labelKey: "messaging.filters.general", label: "Général" },
  { id: "sent", labelKey: "messaging.filters.sent", label: "Envoyés" },
  { id: "trash", labelKey: "messaging.filters.trash", label: "Corbeille" },
];

/** Unread messages, or marked as unread ("Marquer comme non lu"). */
export const isUnreadConversation = (conv) =>
  (conv?.nonLus || 0) > 0 || !!conv?.marqueNonLu;

/** Starred conversation, or one containing a message I starred. */
export const isFavoriteConversation = (conv) =>
  !!conv?.favori || !!conv?.contientFavori;

/** Class, group and general broadcast conversations. */
export const isGeneralConversation = (conv) =>
  !!conv?.general || isGroup(conv) || !!conv?.classeId;

/** The last message is mine, or I started the conversation. */
export const isSentConversation = (conv, myId) =>
  !!myId &&
  (conv?.dernierMessage?.expediteurId === myId || conv?.createdBy === myId);

export const conversationMatchesFilter = (conv, filter, myId) => {
  switch (filter) {
    case "unread":
      return isUnreadConversation(conv);
    case "favorites":
      return isFavoriteConversation(conv);
    case "general":
      return isGeneralConversation(conv);
    case "sent":
      return isSentConversation(conv, myId);
    default:
      return true;
  }
};

/** Display name: group title, or the other person of a direct chat. */
export const conversationName = (conv, myId, t = defaultT) => {
  if (!conv) return "";
  const others = otherParticipants(conv, myId);
  if (isGroup(conv)) {
    if (conv.titre) return conv.titre;
    return others.map((p) => p.prenom || p.nom).filter(Boolean).join(", ") ||
      t("messaging.common.group", "Groupe");
  }
  return others[0]
    ? fullName(others[0], t)
    : conv.titre || t("messaging.common.me", "Moi");
};

/** Translated label of a user type (PROFESSEUR, ELEVE...), "" if unknown. */
export const roleLabel = (type, t = defaultT) => {
  switch ((type || "").toUpperCase()) {
    case "PROFESSEUR":
      return t("messaging.roles.professor", "Professeur");
    case "ELEVE":
      return t("messaging.roles.student", "Élève");
    case "PARENT":
      return t("messaging.roles.parent", "Parent");
    case "REPETITEUR":
      return t("messaging.roles.tutor", "Répétiteur");
    case "ADMIN":
      return t("messaging.roles.admin", "Administrateur");
    default:
      return "";
  }
};

export const conversationSubtitle = (conv, myId, t = defaultT) => {
  if (!conv) return "";
  if (isGroup(conv)) {
    const others = otherParticipants(conv, myId);
    const count = t("messaging.common.participantsCount", "{{count}} participants", {
      count: others.length + 1,
    });
    return isClassConversation(conv)
      ? t("messaging.common.classSubtitle", "Classe · {{count}}", { count })
      : count;
  }
  const other = otherParticipants(conv, myId)[0];
  return roleLabel(other?.typeUtilisateur, t);
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatTime = (value, language) => {
  const d = parseMessageDate(value);
  return d
    ? d.toLocaleTimeString(dateLocale(language), {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
};

/** List timestamp: time today, "Hier", weekday this week, else date. */
export const formatListDate = (value, t = defaultT, language) => {
  const d = parseMessageDate(value);
  if (!d) return "";
  const now = new Date();
  if (sameDay(d, now)) return formatTime(value, language);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return t("messaging.dates.yesterday", "Hier");
  if (now - d < 6 * 24 * 3600 * 1000) {
    return d.toLocaleDateString(dateLocale(language), { weekday: "long" });
  }
  return d.toLocaleDateString(dateLocale(language));
};

export const dayKey = (value) => {
  const d = parseMessageDate(value);
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : "";
};

export const formatDayLabel = (value, t = defaultT, language) => {
  const d = parseMessageDate(value);
  if (!d) return "";
  const now = new Date();
  if (sameDay(d, now)) return t("messaging.dates.today", "Aujourd'hui");
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return t("messaging.dates.yesterday", "Hier");
  return d.toLocaleDateString(dateLocale(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

/** Preview line of a message (for the reply quote / list). */
export const messageExcerpt = (msg, max = 100, t = defaultT) => {
  if (!msg) return "";
  if (msg.supprimePourTous || msg.supprime) return deletedLabel(t);
  const text = (msg.contenu || "").trim();
  if (!text) return msg.medias?.length ? attachmentLabel(t) : "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/**
 * Tick state of one of my messages: READ once every other participant's
 * lastReadAt reached it (kept up to date by CONVERSATION_READ pushes).
 */
export const messageStatus = (msg, conv, myId) => {
  if (!msg || msg.expediteurId !== myId) return null;
  if (msg.statut === "READ") return "READ";
  const others = otherParticipants(conv, myId);
  const when = dateMs(msg.date);
  if (
    others.length > 0 &&
    others.every((p) => p.lastReadAt && dateMs(p.lastReadAt) >= when)
  ) {
    return "READ";
  }
  return msg.statut || "SENT";
};

export const sortConversations = (list) =>
  [...list].sort(
    (a, b) =>
      dateMs(b.lastMessageAt || b.dernierMessage?.date || b.createdAt) -
      dateMs(a.lastMessageAt || a.dernierMessage?.date || a.createdAt),
  );

/** Conversation-list preview built from a ChatMessageDto. */
export const toLastMessage = (msg, t = defaultT) => ({
  id: msg.id,
  contenu: msg.supprimePourTous
    ? ""
    : (msg.contenu || "").trim() || (msg.medias?.length ? attachmentLabel(t) : ""),
  expediteurId: msg.expediteurId,
  expediteurPrenom: msg.expediteurPrenom,
  expediteurNom: msg.expediteurNom,
  date: msg.date,
  supprime: !!msg.supprimePourTous,
});
