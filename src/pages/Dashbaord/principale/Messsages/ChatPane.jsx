import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faBan,
  faBell,
  faBellSlash,
  faCheck,
  faCheckDouble,
  faChevronDown,
  faCopy,
  faEllipsisVertical,
  faEnvelope,
  faPaperPlane,
  faReply,
  faStar,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import {
  AttachButton,
  AttachmentPreviewList,
  MessageAttachments,
} from "./MessageAttachments";
import { MAX_ATTACHMENTS, useMessageAttachments } from "./messageMedia";
import DeleteMessageDialog from "./DeleteMessageDialog";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ConversationAvatar, ConversationBadge } from "./ConversationList";
import {
  conversationName,
  dayKey,
  deletedLabel,
  formatDayLabel,
  formatTime,
  fullName,
  isGroup,
  messageExcerpt,
  messageStatus,
  otherParticipants,
  roleLabel,
} from "./chatUtils";

const SENDER_COLORS = [
  "#e65100",
  "#2e7d32",
  "#6a1b9a",
  "#c62828",
  "#00838f",
  "#ad1457",
  "#4527a0",
  "#558b2f",
];
const senderColor = (id = "") => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
};

const useOutsideClose = (open, onClose) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
};

const QuoteBlock = ({ reply, myId, mine, isDark, onClick }) => {
  const { t } = useTranslation();
  const name =
    reply.expediteurId === myId
      ? t("messaging.common.you", "Vous")
      : `${reply.expediteurPrenom || ""} ${reply.expediteurNom || ""}`.trim() ||
        t("messaging.common.message", "Message");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left mb-1 px-2 py-1 rounded-md border-l-4 ${
        mine
          ? "bg-black/10 border-white/70"
          : isDark
            ? "bg-black/20"
            : "bg-black/5"
      }`}
      style={mine ? undefined : { borderLeftColor: senderColor(reply.expediteurId) }}
      title={t("messaging.chat.viewOriginal", "Voir le message d'origine")}
    >
      <span
        className="block text-xs font-semibold truncate"
        style={mine ? undefined : { color: senderColor(reply.expediteurId) }}
      >
        {name}
      </span>
      <span
        className={`block text-xs truncate ${reply.supprime ? "italic opacity-70" : "opacity-80"}`}
      >
        {reply.supprime ? deletedLabel(t) : reply.extrait || ""}
      </span>
    </button>
  );
};

const Ticks = ({ status }) => {
  const { t } = useTranslation();
  if (!status) return null;
  if (status === "READ") {
    return (
      <FontAwesomeIcon
        icon={faCheckDouble}
        className="text-sky-300"
        style={{ fontSize: 11 }}
        title={t("messaging.chat.read", "Lu")}
      />
    );
  }
  return (
    <FontAwesomeIcon
      icon={faCheck}
      className="opacity-70"
      style={{ fontSize: 11 }}
      title={t("messaging.chat.sent", "Envoyé")}
    />
  );
};

const MessageBubble = ({
  msg,
  conv,
  myId,
  isDark,
  themeColors,
  showSender,
  highlighted,
  onReply,
  onDelete,
  onQuoteClick,
  onToggleStar,
}) => {
  const { t, language } = useTranslation();
  const mine = msg.expediteurId === myId;
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useOutsideClose(menuOpen, closeMenu);
  const deleted = !!msg.supprimePourTous;
  const status = messageStatus(msg, conv, myId);

  const copy = () => {
    setMenuOpen(false);
    const text = msg.contenu || "";
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
  };

  const bubbleClass = mine
    ? "text-white rounded-2xl rounded-br-md"
    : isDark
      ? "bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md"
      : "bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm";

  return (
    <div
      id={`chat-msg-${msg.id}`}
      className={`group flex ${mine ? "justify-end" : "justify-start"} px-3 py-0.5`}
    >
      <div
        className={`relative flex items-end gap-1 max-w-[85%] md:max-w-[70%] ${mine ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`relative px-3 py-2 min-w-[72px] transition-shadow ${bubbleClass} ${highlighted ? "ring-4 ring-yellow-300" : ""}`}
          style={mine ? { backgroundColor: themeColors.primary } : undefined}
        >
          {showSender && !mine && (
            <div
              className="text-xs font-semibold mb-0.5"
              style={{ color: senderColor(msg.expediteurId) }}
            >
              {`${msg.expediteurPrenom || ""} ${msg.expediteurNom || ""}`.trim()}
            </div>
          )}
          {msg.replyTo && !deleted && (
            <QuoteBlock
              reply={msg.replyTo}
              myId={myId}
              mine={mine}
              isDark={isDark}
              onClick={() => onQuoteClick(msg.replyTo.id)}
            />
          )}
          {deleted ? (
            <div className="text-sm italic opacity-80 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBan} style={{ fontSize: 12 }} />
              {deletedLabel(t)}
            </div>
          ) : (
            <>
              <MessageAttachments
                medias={msg.medias}
                isDark={isDark && !mine}
                className={msg.contenu ? "mb-1" : ""}
              />
              {msg.contenu && (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {msg.contenu}
                </div>
              )}
            </>
          )}
          <div
            className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${mine ? "text-white/80" : "opacity-60"}`}
          >
            {msg.favori && !deleted && (
              <span
                title={t("messaging.chat.starredMessage", "Message favori")}
                data-testid="msg-star-icon"
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={mine ? "text-amber-200" : "text-amber-400"}
                  style={{ fontSize: 10 }}
                />
              </span>
            )}
            {formatTime(msg.date, language)}
            {mine && !deleted && <Ticks status={status} />}
          </div>
        </div>

        {/* Hover actions */}
        {!deleted || mine ? (
          <div
            ref={menuRef}
            className={`relative flex items-center gap-0.5 self-center ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"} transition-opacity`}
          >
            {!deleted && (
              <button
                type="button"
                onClick={() => onReply(msg)}
                className={`p-1.5 rounded-full text-xs ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"}`}
                title={t("messaging.common.reply", "Répondre")}
                aria-label={t("messaging.common.reply", "Répondre")}
              >
                <FontAwesomeIcon icon={faReply} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`p-1.5 rounded-full text-xs ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"}`}
              title={t("messaging.chat.moreOptions", "Plus d'options")}
              aria-label={t("messaging.chat.moreOptions", "Plus d'options")}
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
            {menuOpen && (
              <div
                className={`absolute z-20 bottom-full mb-1 ${mine ? "right-0" : "left-0"} w-52 rounded-xl shadow-lg border py-1 text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-800"}`}
              >
                {!deleted && (
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      setMenuOpen(false);
                      onReply(msg);
                    }}
                  >
                    <FontAwesomeIcon icon={faReply} className="w-4" />
                    {t("messaging.common.reply", "Répondre")}
                  </button>
                )}
                {!deleted && msg.contenu && (
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    onClick={copy}
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-4" />
                    {t("messaging.chat.copy", "Copier")}
                  </button>
                )}
                {!deleted && onToggleStar && (
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleStar(msg);
                    }}
                    data-testid="msg-star"
                  >
                    <FontAwesomeIcon
                      icon={msg.favori ? faStarRegular : faStar}
                      className="w-4"
                    />
                    {msg.favori
                      ? t("messaging.common.removeFavorite", "Retirer des favoris")
                      : t("messaging.common.addFavorite", "Ajouter aux favoris")}
                  </button>
                )}
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(msg);
                  }}
                >
                  <FontAwesomeIcon icon={faTrashCan} className="w-4" />
                  {t("messaging.common.delete", "Supprimer")}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ChatPane = ({
  conv,
  myId,
  isDark,
  themeColors,
  narrow,
  onBack,
  messages,
  hasMore,
  loading,
  loadingOlder,
  error,
  onLoadOlder,
  onEnsureLoaded,
  onSend,
  onDeleteMessage,
  onHide,
  onToggleMute,
  onToggleFavorite,
  onMarkUnread,
  onToggleMessageStar,
  jumpTarget,
}) => {
  const { t, language } = useTranslation();
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const nearBottomRef = useRef(true);
  const prependRef = useRef(null);
  const prevRef = useRef({ convId: null, first: null, last: null });
  const pendingJumpRef = useRef(null);
  const [highlightId, setHighlightId] = useState(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const closeHeaderMenu = useCallback(() => setHeaderMenu(false), []);
  const headerMenuRef = useOutsideClose(headerMenu, closeHeaderMenu);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const attachments = useMessageAttachments();
  const { clear: clearAttachments } = attachments;

  // Reset the composer when switching conversation.
  useEffect(() => {
    setText("");
    setReplyTo(null);
    setSendError(null);
    clearAttachments();
    nearBottomRef.current = true;
  }, [conv?.id, clearAttachments]);

  const highlight = useCallback((id) => {
    const el = document.getElementById(`chat-msg-${id}`);
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(id);
    setTimeout(() => setHighlightId((h) => (h === id ? null : h)), 1800);
    return true;
  }, []);

  // Scroll management: initial -> bottom; older page -> keep position;
  // new message at the end -> follow when already at the bottom (or mine).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const first = messages[0]?.id || null;
    const lastMsg = messages[messages.length - 1];
    const last = lastMsg?.id || null;
    const prev = prevRef.current;
    if (prev.convId !== conv?.id) {
      el.scrollTop = el.scrollHeight;
    } else if (prependRef.current && first !== prev.first) {
      const { height, top } = prependRef.current;
      el.scrollTop = el.scrollHeight - height + top;
      prependRef.current = null;
    } else if (last && last !== prev.last) {
      if (nearBottomRef.current || lastMsg.expediteurId === myId) {
        el.scrollTop = el.scrollHeight;
      }
    }
    prevRef.current = { convId: conv?.id, first, last };
    if (pendingJumpRef.current && highlight(pendingJumpRef.current)) {
      pendingJumpRef.current = null;
    }
  }, [messages, conv?.id, myId, highlight]);

  const loadOlder = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || loadingOlder) return;
    prependRef.current = { height: el.scrollHeight, top: el.scrollTop };
    onLoadOlder();
  }, [hasMore, loadingOlder, onLoadOlder]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (el.scrollTop < 80) loadOlder();
  };

  const jumpTo = useCallback(
    async (id) => {
      if (!id) return;
      if (highlight(id)) return;
      const el = containerRef.current;
      if (el) prependRef.current = { height: el.scrollHeight, top: el.scrollTop };
      pendingJumpRef.current = id;
      const found = await onEnsureLoaded(id);
      if (!found) {
        pendingJumpRef.current = null;
        prependRef.current = null;
      }
    },
    [highlight, onEnsureLoaded],
  );

  // Jump requested from outside (notification deep link).
  useEffect(() => {
    if (jumpTarget?.id && !loading) jumpTo(jumpTarget.id);
  }, [jumpTarget, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const canSend =
    !sending &&
    !attachments.uploading &&
    !attachments.hasErrors &&
    (!!text.trim() || attachments.medias.length > 0);

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setSendError(null);
    try {
      await onSend({
        contenu: text.trim(),
        medias: attachments.medias,
        replyToId: replyTo?.id,
      });
      setText("");
      setReplyTo(null);
      attachments.clear();
      nearBottomRef.current = true;
    } catch (e) {
      setSendError(
        e.message || t("messaging.chat.sendFailed", "Échec de l'envoi du message."),
      );
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const startReply = (msg) => {
    setReplyTo(msg);
    textareaRef.current?.focus();
  };

  const confirmDelete = async (pourTous) => {
    if (!deleteRequest) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      if (deleteRequest.kind === "conversation") await onHide();
      else await onDeleteMessage(deleteRequest.msg, pourTous);
      setDeleteRequest(null);
      if (replyTo && deleteRequest.msg?.id === replyTo.id) setReplyTo(null);
    } catch (e) {
      setDeleteError(
        e.message || t("messaging.common.deleteFailed", "Suppression impossible."),
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!conv) return null;
  const group = isGroup(conv);
  const others = otherParticipants(conv, myId);
  const subtitle = group
    ? [
        t("messaging.common.you", "Vous"),
        ...others.map((p) => p.prenom || fullName(p, t)),
      ].join(", ")
    : (others[0]?.typeUtilisateur &&
        roleLabel(others[0].typeUtilisateur, t)) ||
      "";
  const muted = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div
      className={`flex flex-col h-full min-h-0 ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-3 py-2.5 border-b ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
      >
        {narrow && (
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            aria-label={t("messaging.chat.backToChats", "Retour aux discussions")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )}
        <ConversationAvatar
          conv={conv}
          myId={myId}
          size={40}
          themeColor={themeColors.primary}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold truncate">
              {conversationName(conv, myId, t)}
            </span>
            <ConversationBadge conv={conv} isDark={isDark} />
          </div>
          {subtitle && (
            <div className={`text-xs truncate ${muted}`}>{subtitle}</div>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            aria-label={
              conv.favori
                ? t("messaging.common.removeFavorite", "Retirer des favoris")
                : t("messaging.common.addFavorite", "Ajouter aux favoris")
            }
            aria-pressed={!!conv.favori}
            title={
              conv.favori
                ? t("messaging.common.removeFavorite", "Retirer des favoris")
                : t("messaging.common.addFavorite", "Ajouter aux favoris")
            }
            data-testid="conv-star"
          >
            <FontAwesomeIcon
              icon={conv.favori ? faStar : faStarRegular}
              className={conv.favori ? "text-amber-400" : ""}
            />
          </button>
        )}
        <div ref={headerMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setHeaderMenu((v) => !v)}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            aria-label={t("messaging.chat.chatOptions", "Options de la discussion")}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
          {headerMenu && (
            <div
              className={`absolute right-0 top-full mt-1 z-30 w-60 rounded-xl shadow-lg border py-1 text-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              {onMarkUnread && (
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setHeaderMenu(false);
                    onMarkUnread();
                  }}
                  data-testid="conv-mark-unread"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="w-4" />
                  {t("messaging.chat.markUnread", "Marquer comme non lu")}
                </button>
              )}
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setHeaderMenu(false);
                    onToggleFavorite();
                  }}
                >
                  <FontAwesomeIcon
                    icon={conv.favori ? faStarRegular : faStar}
                    className="w-4"
                  />
                  {conv.favori
                    ? t("messaging.common.removeFavorite", "Retirer des favoris")
                    : t("messaging.common.addFavorite", "Ajouter aux favoris")}
                </button>
              )}
              <button
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={() => {
                  setHeaderMenu(false);
                  onToggleMute();
                }}
              >
                <FontAwesomeIcon
                  icon={conv.muted ? faBell : faBellSlash}
                  className="w-4"
                />
                {conv.muted
                  ? t("messaging.chat.unmute", "Réactiver les notifications")
                  : t("messaging.chat.mute", "Désactiver les notifications")}
              </button>
              <button
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={() => {
                  setHeaderMenu(false);
                  setDeleteError(null);
                  setDeleteRequest({ kind: "conversation" });
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} className="w-4" />
                {t("messaging.chat.deleteChat", "Supprimer la discussion")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className={`flex-1 min-h-0 overflow-y-auto py-2 ${isDark ? "bg-gray-900" : "bg-[#efeae2]"}`}
      >
        {loadingOlder && (
          <div className={`text-center text-xs py-2 ${muted}`}>
            <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin mr-1" />
            {t("messaging.chat.loadingOlder", "Chargement des messages précédents…")}
          </div>
        )}
        {!hasMore && !loading && messages.length > 0 && (
          <div className={`text-center text-[11px] py-2 ${muted}`}>
            {t("messaging.chat.chatStart", "Début de la discussion")}
          </div>
        )}
        {loading && messages.length === 0 ? (
          <div className={`text-center text-sm py-8 ${muted}`}>
            <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin mr-2" />
            {t("messaging.common.loading", "Chargement…")}
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center text-sm py-8 text-red-600">{error}</div>
        ) : messages.length === 0 ? (
          <div className={`text-center text-sm py-8 ${muted}`}>
            {t("messaging.chat.empty", "Aucun message. Écrivez le premier !")}
          </div>
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || dayKey(prev.date) !== dayKey(msg.date);
            const showSender =
              group &&
              (newDay || !prev || prev.expediteurId !== msg.expediteurId);
            return (
              <Fragment key={msg.id}>
                {newDay && (
                  <div className="flex justify-center my-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs shadow-sm ${isDark ? "bg-gray-800 text-gray-300" : "bg-white/90 text-gray-600"}`}
                    >
                      {formatDayLabel(msg.date, t, language)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  conv={conv}
                  myId={myId}
                  isDark={isDark}
                  themeColors={themeColors}
                  showSender={showSender}
                  highlighted={highlightId === msg.id}
                  onReply={startReply}
                  onDelete={(m) => {
                    setDeleteError(null);
                    setDeleteRequest({ kind: "message", msg: m });
                  }}
                  onQuoteClick={jumpTo}
                  onToggleStar={onToggleMessageStar}
                />
              </Fragment>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div
        className={`border-t px-3 py-2 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
      >
        {replyTo && (
          <div
            className={`flex items-start gap-2 mb-2 px-3 py-2 rounded-lg border-l-4 ${isDark ? "bg-gray-700" : "bg-white"}`}
            style={{ borderLeftColor: themeColors.primary }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-semibold"
                style={{ color: themeColors.primary }}
              >
                {t("messaging.chat.replyTo", "Réponse à")}{" "}
                {replyTo.expediteurId === myId
                  ? t("messaging.chat.yourself", "vous-même")
                  : `${replyTo.expediteurPrenom || ""} ${replyTo.expediteurNom || ""}`.trim()}
              </div>
              <div className={`text-xs truncate ${muted}`}>
                {messageExcerpt(replyTo, undefined, t)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className={muted}
              aria-label={t("messaging.chat.cancelReply", "Annuler la réponse")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}
        {attachments.items.length > 0 && (
          <div className="mb-2">
            <AttachmentPreviewList
              items={attachments.items}
              onRemove={attachments.removeItem}
              onRetry={attachments.retryItem}
              isDark={isDark}
            />
          </div>
        )}
        {sendError && (
          <div className="mb-2 text-xs text-red-600">{sendError}</div>
        )}
        <div className="flex items-end gap-2">
          <AttachButton
            onFiles={(files) => {
              const rejected = attachments.addFiles(files);
              if (rejected > 0) {
                setSendError(
                  t(
                    "messaging.attachments.maxPerMessage",
                    "Au plus {{max}} pièces jointes par message.",
                    { max: MAX_ATTACHMENTS },
                  ),
                );
              }
            }}
            disabled={sending || attachments.items.length >= MAX_ATTACHMENTS}
            isDark={isDark}
            className={`p-2.5 rounded-full ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
          />
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("messaging.chat.inputPlaceholder", "Écrire un message")}
            className={`flex-1 resize-none px-4 py-2.5 rounded-2xl outline-none text-sm max-h-40 ${isDark ? "bg-gray-700 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 border border-gray-200"}`}
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: themeColors.primary }}
            aria-label={t("messaging.common.send", "Envoyer")}
            title={t("messaging.common.send", "Envoyer")}
          >
            <FontAwesomeIcon
              icon={sending ? faArrowsRotate : faPaperPlane}
              className={sending ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {deleteRequest && (
        <DeleteMessageDialog
          isDark={isDark}
          title={
            deleteRequest.kind === "conversation"
              ? t("messaging.deleteDialog.chatTitle", "Supprimer la discussion ?")
              : t("messaging.deleteDialog.messageTitle", "Supprimer le message ?")
          }
          description={
            deleteRequest.kind === "conversation"
              ? t(
                  "messaging.deleteDialog.chatDescription",
                  "La discussion et son historique iront dans la corbeille, d'où vous pourrez la restaurer. Elle réapparaîtra si un nouveau message arrive.",
                )
              : t(
                  "messaging.deleteDialog.messageDescription",
                  "Le message ira dans votre corbeille, d'où vous pourrez le restaurer.",
                )
          }
          meLabel={
            deleteRequest.kind === "conversation"
              ? t("messaging.chat.deleteChat", "Supprimer la discussion")
              : t("messaging.deleteDialog.deleteForMe", "Supprimer pour moi")
          }
          canEveryone={
            deleteRequest.kind === "message" &&
            deleteRequest.msg.expediteurId === myId &&
            !deleteRequest.msg.supprimePourTous
          }
          busy={deleteBusy}
          error={deleteError}
          onEveryone={() => confirmDelete(true)}
          onMe={() => confirmDelete(false)}
          onCancel={() => setDeleteRequest(null)}
        />
      )}
    </div>
  );
};

export default ChatPane;
