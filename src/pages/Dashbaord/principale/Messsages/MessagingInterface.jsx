import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  openingDone,
  openingFailed,
  openingStart,
  useMountedRef,
} from "../../../../utils/notificationNavigation";
import { conversationService } from "../../../../services/ConversationService";
import {
  useMessageSocket,
  refreshUnreadMessageCount,
} from "../../../../hooks/useMessageSocket";
import ConversationList from "./ConversationList";
import ChatPane from "./ChatPane";
import ComposeModal from "./ComposeModal";
import DeleteMessageDialog from "./DeleteMessageDialog";
import { useAuth } from "../../../../context/AuthContext";
import { conversationName, sortConversations, toLastMessage } from "./chatUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../../../../hooks/useTranslation";

const PAGE_SIZE = 30;
const EMPTY_TRASH = { conversations: [], messages: [] };
const MAX_JUMP_PAGES = 10;
const NARROW_WIDTH = 760;

const emptyChat = {
  convId: null,
  messages: [],
  hasMore: false,
  loading: false,
  loadingOlder: false,
  error: null,
};

/** Insert or replace messages by id, keeping chronological order. */
const mergeMessages = (current, incoming) => {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, { ...byId.get(m.id), ...m }));
  const order = [];
  const seen = new Set();
  [...incoming, ...current].forEach((m) => {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      order.push(byId.get(m.id));
    }
  });
  return order.sort((a, b) => {
    const da = Date.parse(a.date) || 0;
    const db = Date.parse(b.date) || 0;
    return da === db ? String(a.id).localeCompare(String(b.id)) : da - db;
  });
};

/**
 * WhatsApp-like messaging: conversation list + chat pane.
 * Notification deep link: tabData { messageId, partnerId (= sender) }.
 */
const MessagingInterface = ({
  isDark = false,
  currentTheme = "blue",
  colorSchemes = {
    blue: { primary: "#1a73e8", light: "#e8f0fe", dark: "#1557b0" },
    green: { primary: "#34a853", light: "#e6f4ea", dark: "#137333" },
    red: { primary: "#ea4335", light: "#fce8e6", dark: "#c5221f" },
  },
  onClose, // eslint-disable-line no-unused-vars
  selectedConversation, // eslint-disable-line no-unused-vars
  userRole = "ADMIN", // eslint-disable-line no-unused-vars
  tabData = null,
}) => {
  const { t } = useTranslation();
  // Latest t for callbacks that must keep stable identities (socket handler).
  const tRef = useRef(t);
  tRef.current = t;
  const themeColors = colorSchemes[currentTheme] || colorSchemes.blue;
  const myId = localStorage.getItem("userId");
  const mountedRef = useMountedRef();

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [chat, setChat] = useState(emptyChat);
  const [showNew, setShowNew] = useState(false);
  // Original compose process ("Nouveau message"): individual / class message,
  // sent through POST /messages and POST /messages/group (classIds).
  const { user: currentUser } = useAuth();
  const emptyDraft = useCallback(
    () => ({ destinataires: [], contenu: "", objet: "", expediteur: currentUser }),
    [currentUser],
  );
  const [newMessage, setNewMessage] = useState(() => ({
    destinataires: [],
    contenu: "",
    objet: "",
    expediteur: currentUser,
  }));
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isGeneralMessage, setIsGeneralMessage] = useState(false);
  const [ccRecipients, setCcRecipients] = useState([]);
  const [, setRecipientSearch] = useState("");
  const [jumpTarget, setJumpTarget] = useState(null);
  // List filters: all | unread | favorites | general | sent | trash
  const [filter, setFilter] = useState("all");
  const [trash, setTrash] = useState(EMPTY_TRASH);
  const [trashLoading, setTrashLoading] = useState(true);
  // Confirmation of a destructive list / trash action
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  const chatRef = useRef(chat);
  chatRef.current = chat;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // ── Responsive: list OR chat when the container is narrow ───────────────
  const rootRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const update = () => setNarrow(el.clientWidth < NARROW_WIDTH);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Conversation list ────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const list = await conversationService.list();
      if (!mountedRef.current) return list;
      setConversations((prev) => {
        // Keep locally-created empty conversations the server doesn't list yet.
        const ids = new Set(list.map((c) => c.id));
        const extra = prev.filter(
          (c) => !ids.has(c.id) && c.id === activeIdRef.current,
        );
        return sortConversations([...list, ...extra]);
      });
      setListError(null);
      return list;
    } catch (e) {
      if (mountedRef.current) setListError(e.message);
      return null;
    } finally {
      if (mountedRef.current) setListLoading(false);
    }
  }, [mountedRef]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Corbeille (my deleted conversations and messages) ───────────────────
  const fetchTrash = useCallback(async () => {
    try {
      const data = await conversationService.trash();
      if (mountedRef.current) setTrash(data);
    } catch (e) {
      // the trash is secondary: keep the current one
    } finally {
      if (mountedRef.current) setTrashLoading(false);
    }
  }, [mountedRef]);

  const trashTimerRef = useRef(null);
  const scheduleTrash = useCallback(() => {
    clearTimeout(trashTimerRef.current);
    trashTimerRef.current = setTimeout(fetchTrash, 250);
  }, [fetchTrash]);

  useEffect(() => {
    fetchTrash();
    return () => clearTimeout(trashTimerRef.current);
  }, [fetchTrash]);

  const patchConversation = useCallback((id, patch) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c,
      ),
    );
  }, []);

  const upsertConversation = useCallback((conv) => {
    if (!conv?.id) return;
    setConversations((prev) =>
      sortConversations([conv, ...prev.filter((c) => c.id !== conv.id)]),
    );
  }, []);

  // ── Read state ───────────────────────────────────────────────────────────
  const markRead = useCallback(
    async (convId) => {
      if (!convId) return;
      patchConversation(convId, { nonLus: 0, marqueNonLu: false });
      try {
        await conversationService.markRead(convId);
      } catch (e) {
        // not critical: the badge is refreshed on the next load
      }
      refreshUnreadMessageCount(myId);
    },
    [myId, patchConversation],
  );

  // ── Active conversation messages ─────────────────────────────────────────
  const loadLatest = useCallback(
    async (convId, { silent = false } = {}) => {
      if (!silent) {
        setChat({ ...emptyChat, convId, loading: true });
      }
      try {
        const page = await conversationService.messages(convId, {
          size: PAGE_SIZE,
        });
        if (!mountedRef.current || activeIdRef.current !== convId) return;
        setChat((prev) => {
          if (silent && prev.convId === convId) {
            return {
              ...prev,
              messages: mergeMessages(prev.messages, page.messages),
              loading: false,
              error: null,
            };
          }
          return {
            ...emptyChat,
            convId,
            messages: page.messages,
            hasMore: page.hasMore,
          };
        });
      } catch (e) {
        if (!mountedRef.current || activeIdRef.current !== convId) return;
        setChat((prev) => ({ ...prev, loading: false, error: e.message }));
      }
    },
    [mountedRef],
  );

  const loadOlder = useCallback(async () => {
    const current = chatRef.current;
    if (!current.convId || !current.hasMore || current.loadingOlder) {
      return [];
    }
    const convId = current.convId;
    const before = current.messages[0]?.id;
    setChat((prev) => ({ ...prev, loadingOlder: true }));
    try {
      const page = await conversationService.messages(convId, {
        before,
        size: PAGE_SIZE,
      });
      if (!mountedRef.current || activeIdRef.current !== convId) return [];
      const next = {
        ...chatRef.current,
        messages: mergeMessages(chatRef.current.messages, page.messages),
        hasMore: page.hasMore,
        loadingOlder: false,
      };
      chatRef.current = next;
      setChat(next);
      return page.messages;
    } catch (e) {
      if (mountedRef.current) {
        setChat((prev) => ({ ...prev, loadingOlder: false }));
      }
      return [];
    }
  }, [mountedRef]);

  /** Loads older pages until the message is present (quote / deep link). */
  const ensureLoaded = useCallback(
    async (messageId) => {
      for (let i = 0; i < MAX_JUMP_PAGES; i += 1) {
        if (chatRef.current.messages.some((m) => m.id === messageId)) {
          return true;
        }
        if (!chatRef.current.hasMore) return false;
        if (chatRef.current.loadingOlder) {
          // a page is already on its way (scroll-triggered): wait for it
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue; // eslint-disable-line no-continue
        }
        const loaded = await loadOlder();
        if (!loaded.length && !chatRef.current.hasMore) return false;
      }
      return chatRef.current.messages.some((m) => m.id === messageId);
    },
    [loadOlder],
  );

  const openConversation = useCallback(
    (conv, { jumpTo } = {}) => {
      if (!conv?.id) return;
      setActiveId(conv.id);
      activeIdRef.current = conv.id;
      if (!conversationsRef.current.some((c) => c.id === conv.id)) {
        upsertConversation(conv);
      }
      loadLatest(conv.id);
      setJumpTarget(jumpTo ? { id: jumpTo, nonce: Date.now() } : null);
      markRead(conv.id);
    },
    [loadLatest, markRead, upsertConversation],
  );

  const closeConversation = useCallback(() => {
    setActiveId(null);
    activeIdRef.current = null;
    setChat(emptyChat);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (payload) => {
      const convId = activeIdRef.current;
      if (!convId) return;
      const msg = await conversationService.send(convId, payload);
      if (!msg?.id) return;
      if (activeIdRef.current === convId) {
        setChat((prev) =>
          prev.convId === convId
            ? { ...prev, messages: mergeMessages(prev.messages, [msg]) }
            : prev,
        );
      }
      setConversations((prev) =>
        sortConversations(
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  dernierMessage: toLastMessage(msg, tRef.current),
                  lastMessageAt: msg.date,
                }
              : c,
          ),
        ),
      );
    },
    [],
  );

  const hideConversation = useCallback(
    async (convId) => {
      await conversationService.hide(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeIdRef.current === convId) closeConversation();
      refreshUnreadMessageCount(myId);
      fetchTrash();
    },
    [closeConversation, myId, fetchTrash],
  );

  const handleHide = useCallback(async () => {
    const convId = activeIdRef.current;
    if (convId) await hideConversation(convId);
  }, [hideConversation]);

  /** Star / unstar a conversation (for me only). */
  const toggleFavorite = useCallback(
    async (convId) => {
      const conv = conversationsRef.current.find((c) => c.id === convId);
      if (!conv) return;
      const next = !conv.favori;
      patchConversation(convId, { favori: next });
      try {
        const updated = await conversationService.setFavorite(convId, next);
        if (updated?.id) patchConversation(convId, { favori: !!updated.favori });
      } catch (e) {
        patchConversation(convId, { favori: !next });
        setListError(e.message);
      }
    },
    [patchConversation],
  );

  /** "Marquer comme non lu": leaves the conversation so it stays unread. */
  const markUnread = useCallback(
    async (convId) => {
      patchConversation(convId, { marqueNonLu: true });
      if (activeIdRef.current === convId) closeConversation();
      try {
        await conversationService.markUnread(convId);
      } catch (e) {
        patchConversation(convId, { marqueNonLu: false });
        setListError(e.message);
      }
      refreshUnreadMessageCount(myId);
    },
    [patchConversation, closeConversation, myId],
  );

  /** Star / unstar one message (old per-user favori status). */
  const handleToggleMessageStar = useCallback(
    async (msg) => {
      const convId = activeIdRef.current;
      if (!convId || !msg?.id) return;
      const next = !msg.favori;
      const setStar = (value) =>
        setChat((prev) =>
          prev.convId === convId
            ? {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === msg.id ? { ...m, favori: value } : m,
                ),
              }
            : prev,
        );
      setStar(next);
      if (next) patchConversation(convId, { contientFavori: true });
      try {
        await conversationService.setMessageFavorite(msg.id, myId, next);
        const fresh = await conversationService.get(convId);
        if (fresh?.id) patchConversation(convId, { contientFavori: !!fresh.contientFavori });
      } catch (e) {
        setStar(!next);
        setListError(e.message);
      }
    },
    [myId, patchConversation],
  );

  const handleRowAction = useCallback(
    (conv, action) => {
      if (action === "favorite") toggleFavorite(conv.id);
      else if (action === "unread") markUnread(conv.id);
      else if (action === "read") markRead(conv.id);
      else if (action === "delete") {
        setConfirmError(null);
        setConfirm({ type: "hide", conv });
      }
    },
    [toggleFavorite, markUnread, markRead],
  );

  // ── Trash actions ───────────────────────────────────────────────────────
  const restoreFromTrash = useCallback(
    async (kind, item) => {
      try {
        if (kind === "conversation") {
          const conv = await conversationService.restoreConversation(item.id);
          if (conv?.id) upsertConversation(conv);
        } else {
          await conversationService.restoreMessage(item.id);
          if (item.conversationId && activeIdRef.current === item.conversationId) {
            loadLatest(item.conversationId, { silent: true });
          }
        }
        setTrash((prev) => ({
          conversations:
            kind === "conversation"
              ? prev.conversations.filter((c) => c.id !== item.id)
              : prev.conversations,
          messages:
            kind === "message"
              ? prev.messages.filter((m) => m.id !== item.id)
              : prev.messages,
        }));
        fetchConversations();
        fetchTrash();
      } catch (e) {
        setListError(e.message);
      }
    },
    [upsertConversation, loadLatest, fetchConversations, fetchTrash],
  );

  const handleTrashAction = useCallback(
    (kind, item, action) => {
      setConfirmError(null);
      if (kind === "empty") setConfirm({ type: "empty" });
      else if (action === "restore") restoreFromTrash(kind, item);
      else if (action === "purge") setConfirm({ type: "purge", kind, item });
    },
    [restoreFromTrash],
  );

  const runConfirm = useCallback(async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      if (confirm.type === "hide") {
        await hideConversation(confirm.conv.id);
      } else if (confirm.type === "empty") {
        await conversationService.emptyTrash();
        setTrash(EMPTY_TRASH);
        fetchConversations();
      } else if (confirm.type === "purge") {
        if (confirm.kind === "conversation") {
          await conversationService.purgeConversation(confirm.item.id);
        } else {
          await conversationService.purgeMessage(confirm.item.id);
        }
        setTrash((prev) => ({
          conversations:
            confirm.kind === "conversation"
              ? prev.conversations.filter((c) => c.id !== confirm.item.id)
              : prev.conversations,
          messages:
            confirm.kind === "message"
              ? prev.messages.filter((m) => m.id !== confirm.item.id)
              : prev.messages,
        }));
        if (confirm.kind === "conversation") fetchConversations();
      }
      fetchTrash();
      setConfirm(null);
    } catch (e) {
      setConfirmError(
        e.message || tRef.current("messaging.common.actionFailed", "Action impossible."),
      );
    } finally {
      setConfirmBusy(false);
    }
  }, [confirm, hideConversation, fetchConversations, fetchTrash]);

  const handleToggleMute = useCallback(async () => {
    const convId = activeIdRef.current;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const next = !conv.muted;
    patchConversation(convId, { muted: next });
    try {
      const updated = await conversationService.setMuted(convId, next);
      if (updated?.id) patchConversation(convId, { muted: !!updated.muted });
    } catch (e) {
      patchConversation(convId, { muted: !next });
      setListError(e.message);
    }
  }, [patchConversation]);

  const closeCompose = useCallback(() => {
    setShowNew(false);
    setNewMessage(emptyDraft());
    setSelectedClasses([]);
    setIsGeneralMessage(false);
    setCcRecipients([]);
  }, [emptyDraft]);

  // ComposeModal's setShowCompose(false) => close and reset the draft.
  const setShowCompose = useCallback(
    (open) => (open ? setShowNew(true) : closeCompose()),
    [closeCompose],
  );

  /**
   * A message sent with the original compose process was attached by the
   * server to a conversation (DIRECT, or the group of its participants):
   * refresh the list and open that conversation.
   */
  const handleMessageSent = useCallback(
    async (sent) => {
      const message = Array.isArray(sent) ? sent[0] : sent;
      await fetchConversations();
      try {
        let conv = null;
        if (message?.conversationId) {
          conv =
            conversationsRef.current.find(
              (c) => c.id === message.conversationId,
            ) || (await conversationService.get(message.conversationId));
        } else if (message?.id) {
          conv = await conversationService.getByMessage(message.id);
        }
        if (mountedRef.current && conv?.id) openConversation(conv);
      } catch (e) {
        if (mountedRef.current) setListError(e.message);
      }
    },
    [fetchConversations, mountedRef, openConversation],
  );

  // ── Realtime ─────────────────────────────────────────────────────────────
  const applyDeletion = useCallback(
    (convId, messageId, pourTous) => {
      if (activeIdRef.current === convId || !convId) {
        setChat((prev) => {
          if (!prev.messages.some((m) => m.id === messageId || m.replyTo?.id === messageId)) {
            return prev;
          }
          let messages = prev.messages.map((m) =>
            m.replyTo?.id === messageId && pourTous
              ? { ...m, replyTo: { ...m.replyTo, supprime: true, extrait: "" } }
              : m,
          );
          messages = pourTous
            ? messages.map((m) =>
                m.id === messageId
                  ? { ...m, supprimePourTous: true, contenu: "", medias: [] }
                  : m,
              )
            : messages.filter((m) => m.id !== messageId);
          return { ...prev, messages };
        });
      }
      const conv = conversationsRef.current.find(
        (c) => c.dernierMessage?.id === messageId,
      );
      if (conv) {
        if (pourTous) {
          patchConversation(conv.id, (c) => ({
            dernierMessage: { ...c.dernierMessage, supprime: true, contenu: "" },
          }));
        } else {
          fetchConversations();
        }
      }
    },
    [fetchConversations, patchConversation],
  );

  const handleDeleteMessage = useCallback(
    async (msg, pourTous) => {
      const convId = activeIdRef.current;
      await conversationService.deleteMessage(convId, msg.id, pourTous);
      applyDeletion(convId, msg.id, pourTous);
      fetchTrash();
    },
    [applyDeletion, fetchTrash],
  );

  const onSocketEvent = useCallback(
    (event) => {
      if (!event?.type) return;
      const convId = event.conversationId || event.chat?.conversationId || null;
      switch (event.type) {
        case "NEW_MESSAGE": {
          const msg = event.chat;
          if (!convId || !msg) {
            fetchConversations(); // legacy push without conversation info
            return;
          }
          const mine = msg.expediteurId === myId;
          const isActive = activeIdRef.current === convId;
          if (isActive) {
            setChat((prev) =>
              prev.convId === convId
                ? { ...prev, messages: mergeMessages(prev.messages, [msg]) }
                : prev,
            );
            if (!mine) markRead(convId);
          }
          const known = conversationsRef.current.find((c) => c.id === convId);
          if (!known) {
            // new conversation, or one of my trash that reappears
            fetchConversations();
            scheduleTrash();
            return;
          }
          setConversations((prev) =>
            sortConversations(
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      dernierMessage: toLastMessage(msg, tRef.current),
                      lastMessageAt: msg.date,
                      nonLus: isActive
                        ? 0
                        : mine
                          ? c.nonLus
                          : (c.nonLus || 0) + 1,
                    }
                  : c,
              ),
            ),
          );
          break;
        }
        case "MESSAGE_DELETED": {
          const messageId = event.message?.id;
          if (!messageId) return;
          applyDeletion(convId, messageId, !!event.pourTous);
          scheduleTrash();
          break;
        }
        case "CONVERSATION_READ": {
          if (!convId) return;
          if (event.lecteurId === myId) {
            patchConversation(convId, { nonLus: 0 });
            return;
          }
          patchConversation(convId, (c) => ({
            participants: (c.participants || []).map((p) =>
              p.id === event.lecteurId ? { ...p, lastReadAt: event.luJusqua } : p,
            ),
          }));
          break;
        }
        case "MESSAGE_RESTORED": {
          fetchConversations();
          scheduleTrash();
          if (activeIdRef.current) {
            loadLatest(activeIdRef.current, { silent: true });
          }
          break;
        }
        // My own view of a conversation changed on another tab / device
        // (favourite, marked unread, muted, trash): reload list and trash.
        case "CONVERSATION_UPDATED": {
          fetchConversations().then((list) => {
            if (
              list &&
              convId &&
              activeIdRef.current === convId &&
              !list.some((c) => c.id === convId)
            ) {
              closeConversation(); // deleted (moved to the trash) elsewhere
            } else if (activeIdRef.current && activeIdRef.current === convId) {
              loadLatest(convId, { silent: true });
            }
          });
          scheduleTrash();
          break;
        }
        case "CORBEILLE_UPDATED": {
          scheduleTrash();
          break;
        }
        default:
          break;
      }
    },
    [
      myId,
      markRead,
      fetchConversations,
      applyDeletion,
      patchConversation,
      loadLatest,
      scheduleTrash,
      closeConversation,
    ],
  );

  const onReconnect = useCallback(() => {
    fetchConversations();
    fetchTrash();
    if (activeIdRef.current) loadLatest(activeIdRef.current, { silent: true });
  }, [fetchConversations, fetchTrash, loadLatest]);

  useMessageSocket(myId, onSocketEvent, onReconnect);

  // ── Open a conversation from a notification ─────────────────────────────
  // tabData: { messageId, partnerId (= sender) }. A request id discards a
  // superseded click.
  const navRidRef = useRef(0);
  useEffect(() => {
    if (!tabData || (!tabData.partnerId && !tabData.messageId)) return;
    const rid = ++navRidRef.current;
    openingStart(t("messaging.notifications.opening", "Ouverture de la conversation…"));
    (async () => {
      let conv = null;
      if (tabData.messageId) {
        try {
          conv = await conversationService.getByMessage(tabData.messageId);
        } catch (e) {
          conv = null;
        }
      }
      if (!conv && tabData.partnerId && tabData.partnerId !== myId) {
        try {
          conv = await conversationService.create([tabData.partnerId]);
        } catch (e) {
          conv = null;
        }
      }
      if (!mountedRef.current || rid !== navRidRef.current) return;
      if (!conv?.id) {
        openingFailed(
          t(
            "messaging.notifications.unavailable",
            "Ce message n'existe plus ou ne vous est plus accessible.",
          ),
        );
        return;
      }
      openingDone();
      openConversation(conv, { jumpTo: tabData.messageId || null });
    })();
  }, [tabData]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const showList = !narrow || !activeConv;
  const showChat = !narrow || !!activeConv;

  return (
    <div
      ref={rootRef}
      className={`flex flex-1 h-full min-h-0 overflow-hidden ${isDark ? "bg-gray-900" : "bg-white"}`}
    >
      {showList && (
        <div
          className={`${narrow ? "w-full" : "w-80 lg:w-96 flex-shrink-0 border-r"} h-full min-h-0 ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(c) => openConversation(c)}
            onNew={() => setShowNew(true)}
            onRefresh={() => {
              fetchConversations();
              fetchTrash();
            }}
            loading={listLoading}
            error={listError}
            myId={myId}
            isDark={isDark}
            themeColors={themeColors}
            narrow={narrow}
            filter={filter}
            onFilterChange={setFilter}
            onAction={handleRowAction}
            trash={trash}
            trashLoading={trashLoading}
            onTrashAction={handleTrashAction}
          />
        </div>
      )}
      {showChat && (
        <div className="flex-1 min-w-0 h-full min-h-0">
          {activeConv ? (
            <ChatPane
              conv={activeConv}
              myId={myId}
              isDark={isDark}
              themeColors={themeColors}
              narrow={narrow}
              onBack={closeConversation}
              messages={chat.convId === activeConv.id ? chat.messages : []}
              hasMore={chat.hasMore}
              loading={chat.loading}
              loadingOlder={chat.loadingOlder}
              error={chat.error}
              onLoadOlder={loadOlder}
              onEnsureLoaded={ensureLoaded}
              onSend={handleSend}
              onDeleteMessage={handleDeleteMessage}
              onHide={handleHide}
              onToggleMute={handleToggleMute}
              onToggleFavorite={() => toggleFavorite(activeConv.id)}
              onMarkUnread={() => markUnread(activeConv.id)}
              onToggleMessageStar={handleToggleMessageStar}
              jumpTarget={jumpTarget}
            />
          ) : (
            <div
              className={`h-full flex flex-col items-center justify-center text-center px-6 ${isDark ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-500"}`}
            >
              <FontAwesomeIcon
                icon={faComments}
                style={{ fontSize: 56, color: themeColors.primary }}
                className="mb-4 opacity-80"
              />
              <h3
                className={`text-lg font-semibold mb-1 ${isDark ? "text-gray-200" : "text-gray-700"}`}
              >
                {t("messaging.home.title", "Vos discussions")}
              </h3>
              <p className="text-sm max-w-sm">
                {t(
                  "messaging.home.subtitle",
                  "Sélectionnez une discussion ou écrivez un nouveau message à vos contacts ou à une classe.",
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="mt-4 px-4 py-2 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: themeColors.primary }}
              >
                {t("messaging.common.newMessage", "Nouveau message")}
              </button>
            </div>
          )}
        </div>
      )}
      {confirm && (
        <DeleteMessageDialog
          isDark={isDark}
          title={
            confirm.type === "empty"
              ? t("messaging.confirm.emptyTitle", "Vider la corbeille ?")
              : confirm.type === "hide"
                ? t("messaging.deleteDialog.chatTitle", "Supprimer la discussion ?")
                : confirm.kind === "conversation"
                  ? t(
                      "messaging.confirm.purgeChatTitle",
                      "Supprimer définitivement la discussion ?",
                    )
                  : t(
                      "messaging.confirm.purgeMessageTitle",
                      "Supprimer définitivement le message ?",
                    )
          }
          description={
            confirm.type === "empty"
              ? t(
                  "messaging.confirm.emptyDescription",
                  "Toutes les discussions et tous les messages de la corbeille seront supprimés définitivement pour vous. Cette action est irréversible.",
                )
              : confirm.type === "hide"
                ? t(
                    "messaging.confirm.hideDescription",
                    "« {{name}} » et son historique iront dans la corbeille, d'où vous pourrez la restaurer. Elle réapparaîtra si un nouveau message arrive.",
                    { name: conversationName(confirm.conv, myId, t) },
                  )
                : t(
                    "messaging.confirm.purgeDescription",
                    "L'élément ne pourra plus être restauré. Les autres participants ne sont pas concernés.",
                  )
          }
          meLabel={
            confirm.type === "empty"
              ? t("messaging.trash.empty", "Vider la corbeille")
              : confirm.type === "hide"
                ? t("messaging.chat.deleteChat", "Supprimer la discussion")
                : t("messaging.trash.purge", "Supprimer définitivement")
          }
          canEveryone={false}
          busy={confirmBusy}
          error={confirmError}
          onMe={runConfirm}
          onCancel={() => !confirmBusy && setConfirm(null)}
        />
      )}
      {showNew && (
        <ComposeModal
          isDark={isDark}
          themeColors={themeColors}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          setRecipientSearch={setRecipientSearch}
          setShowCompose={setShowCompose}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          isGeneralMessage={isGeneralMessage}
          setIsGeneralMessage={setIsGeneralMessage}
          currentUser={currentUser}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
};

export default MessagingInterface;
