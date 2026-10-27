import axios from "axios";

/**
 * Chat (WhatsApp-like) API: conversations and their messages.
 * Same base URL / Bearer token as MessageService.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Content-Type"] = "application/json";
  return config;
});

/** Error carrying the server's French message (403/400/404 bodies). */
const apiError = (error, fallback) => {
  const data = error?.response?.data;
  const err = new Error(
    data?.message || (typeof data === "string" && data) || fallback,
  );
  err.status = error?.response?.status;
  err.code = data?.code;
  return err;
};

const call = async (promise, fallback) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw apiError(error, fallback);
  }
};

export const conversationService = {
  /** GET /conversations — mine, most recent first. */
  async list() {
    const data = await call(
      api.get("/conversations"),
      "Impossible de charger vos discussions.",
    );
    return Array.isArray(data) ? data : [];
  },

  get(conversationId) {
    return call(
      api.get(`/conversations/${conversationId}`),
      "Discussion introuvable.",
    );
  },

  /** Conversation holding a message (notification deep links). */
  getByMessage(messageId) {
    return call(
      api.get(`/conversations/par-message/${messageId}`),
      "Ce message n'existe plus ou ne vous est plus accessible.",
    );
  },

  unreadCount() {
    return call(
      api.get("/conversations/non-lus/count"),
      "Impossible de compter les messages non lus.",
    );
  },

  /** 1 other participant => find-or-create DIRECT; several => new GROUPE. */
  create(participantIds, titre) {
    return call(
      api.post("/conversations", {
        participantIds,
        ...(titre ? { titre } : {}),
      }),
      "Impossible de créer la discussion.",
    );
  },

  /** { messages (chronological), hasMore }. */
  async messages(conversationId, { before, size = 30 } = {}) {
    const data = await call(
      api.get(`/conversations/${conversationId}/messages`, {
        params: { size, ...(before ? { before } : {}) },
      }),
      "Impossible de charger les messages.",
    );
    return {
      messages: Array.isArray(data?.messages) ? data.messages : [],
      hasMore: !!data?.hasMore,
    };
  },

  send(conversationId, { contenu, medias, replyToId }) {
    return call(
      api.post(`/conversations/${conversationId}/messages`, {
        contenu: contenu || "",
        medias: medias || [],
        ...(replyToId ? { replyToId } : {}),
      }),
      "Échec de l'envoi du message.",
    );
  },

  markRead(conversationId) {
    return call(
      api.post(`/conversations/${conversationId}/lu`),
      "Impossible de marquer la discussion comme lue.",
    );
  },

  deleteMessage(conversationId, messageId, pourTous) {
    return call(
      api.delete(`/conversations/${conversationId}/messages/${messageId}`, {
        params: { pourTous: !!pourTous },
      }),
      "Impossible de supprimer le message.",
    );
  },

  /** Move the conversation to my trash (restorable; it reappears on a new message). */
  hide(conversationId) {
    return call(
      api.delete(`/conversations/${conversationId}`),
      "Impossible de supprimer la discussion.",
    );
  },

  /** Star / unstar the conversation (for me only). */
  setFavorite(conversationId, favori) {
    return call(
      api.put(`/conversations/${conversationId}/favori`, null, {
        params: { favori: !!favori },
      }),
      "Impossible de modifier les favoris.",
    );
  },

  /** "Marquer comme non lu" (cleared when the conversation is read). */
  markUnread(conversationId) {
    return call(
      api.put(`/conversations/${conversationId}/non-lu`),
      "Impossible de marquer la discussion comme non lue.",
    );
  },

  /** Star / unstar one message (legacy per-user status endpoint). */
  setMessageFavorite(messageId, userId, favori) {
    return call(
      api.post(`/messages/${messageId}/statut/${userId}/favori`, null, {
        params: { favori: !!favori },
      }),
      "Impossible de modifier les favoris.",
    );
  },

  /** My trash: { conversations, messages, total }. */
  async trash() {
    const data = await call(
      api.get("/conversations/corbeille"),
      "Impossible de charger la corbeille.",
    );
    return {
      conversations: Array.isArray(data?.conversations) ? data.conversations : [],
      messages: Array.isArray(data?.messages) ? data.messages : [],
    };
  },

  restoreConversation(conversationId) {
    return call(
      api.post(`/conversations/${conversationId}/restaurer`),
      "Impossible de restaurer la discussion.",
    );
  },

  purgeConversation(conversationId) {
    return call(
      api.delete(`/conversations/${conversationId}/definitif`),
      "Impossible de supprimer définitivement la discussion.",
    );
  },

  restoreMessage(messageId) {
    return call(
      api.post(`/conversations/corbeille/messages/${messageId}/restaurer`),
      "Impossible de restaurer le message.",
    );
  },

  purgeMessage(messageId) {
    return call(
      api.delete(`/conversations/corbeille/messages/${messageId}`),
      "Impossible de supprimer définitivement le message.",
    );
  },

  emptyTrash() {
    return call(
      api.delete("/conversations/corbeille"),
      "Impossible de vider la corbeille.",
    );
  },

  setMuted(conversationId, muted) {
    return call(
      api.put(`/conversations/${conversationId}/muet`, null, {
        params: { muted: !!muted },
      }),
      "Impossible de modifier les notifications.",
    );
  },
};

export default conversationService;
