import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBellSlash,
  faChalkboardUser,
  faChevronDown,
  faCircleExclamation,
  faEnvelope,
  faEnvelopeOpen,
  faMagnifyingGlass,
  faPenToSquare,
  faStar,
  faTrashCan,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import {
  CONVERSATION_FILTERS,
  conversationMatchesFilter,
  conversationName,
  deletedLabel,
  formatListDate,
  initialsOf,
  isClassConversation,
  isFavoriteConversation,
  isGeneralBroadcast,
  isGroup,
  isUnreadConversation,
  otherParticipants,
} from "./chatUtils";
import TrashList from "./TrashList";
import { useTranslation } from "../../../../hooks/useTranslation";

export const ConversationAvatar = ({ conv, myId, size = 48, themeColor }) => {
  const { t } = useTranslation();
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    backgroundColor: themeColor || "#1a73e8",
  };
  if (isGroup(conv)) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={style}
        title={
          isClassConversation(conv)
            ? t("messaging.conversations.classMessage", "Message à une classe")
            : t("messaging.common.group", "Groupe")
        }
      >
        <FontAwesomeIcon
          icon={isClassConversation(conv) ? faChalkboardUser : faUsers}
        />
      </div>
    );
  }
  const other = otherParticipants(conv, myId)[0];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={style}
    >
      {initialsOf(other)}
    </div>
  );
};

/** "Classe" (message à une classe) or "Général" (message to several classes) badge. */
export const ConversationBadge = ({ conv, isDark }) => {
  const { t } = useTranslation();
  const label = isGeneralBroadcast(conv)
    ? t("messaging.conversations.badgeGeneral", "Général")
    : isClassConversation(conv)
      ? t("messaging.conversations.badgeClass", "Classe")
      : null;
  if (!label) return null;
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${isDark ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700"}`}
    >
      {label}
    </span>
  );
};

const previewOf = (conv, myId, t) => {
  const last = conv.dernierMessage;
  if (!last) {
    return {
      text: t("messaging.conversations.newChat", "Nouvelle discussion"),
      italic: true,
    };
  }
  if (last.supprime) return { text: deletedLabel(t), italic: true };
  let prefix = "";
  if (last.expediteurId === myId) {
    prefix = t("messaging.conversations.youPrefix", "Vous : ");
  } else if (isGroup(conv) && last.expediteurPrenom) {
    prefix = t("messaging.conversations.senderPrefix", "{{name}} : ", {
      name: last.expediteurPrenom,
    });
  }
  return { text: prefix + (last.contenu || ""), italic: false };
};

const matchesSearch = (conv, term, myId, t) =>
  [
    conversationName(conv, myId, t),
    conv.dernierMessage?.contenu || "",
    ...(conv.participants || []).map((p) => `${p.prenom || ""} ${p.nom || ""}`),
  ]
    .join(" ")
    .toLowerCase()
    .includes(term);

const emptyText = (filter, t) => {
  switch (filter) {
    case "unread":
      return t("messaging.conversations.empty.unread", "Aucune discussion non lue.");
    case "favorites":
      return t(
        "messaging.conversations.empty.favorites",
        "Aucun favori. Ajoutez une discussion ou un message aux favoris avec l'étoile.",
      );
    case "general":
      return t(
        "messaging.conversations.empty.general",
        "Aucun message de classe, de groupe ou général.",
      );
    case "sent":
      return t("messaging.conversations.empty.sent", "Aucune discussion envoyée.");
    default:
      return t(
        "messaging.conversations.empty.all",
        "Aucune discussion pour le moment. Écrivez à un contact ou à une classe avec « Nouveau message ».",
      );
  }
};

/** Per-row actions (hover on desktop, always visible on narrow screens). */
const RowMenu = ({ conv, isDark, narrow, onAction }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const unread = isUnreadConversation(conv);
  const item = `w-full flex items-center gap-2 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`;
  const run = (action) => (e) => {
    e.stopPropagation();
    setOpen(false);
    onAction(conv, action);
  };
  return (
    <div
      ref={ref}
      className={`relative flex-shrink-0 ${open || narrow ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-200"}`}
        aria-label={t("messaging.chat.chatOptions", "Options de la discussion")}
        title={t("messaging.chat.chatOptions", "Options de la discussion")}
        data-testid="conv-row-menu"
      >
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
      {open && (
        <div
          className={`absolute right-0 top-full mt-1 z-30 w-56 rounded-xl shadow-lg border py-1 text-sm ${isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-800"}`}
          role="menu"
        >
          <button type="button" className={item} onClick={run(unread ? "read" : "unread")}>
            <FontAwesomeIcon icon={unread ? faEnvelopeOpen : faEnvelope} className="w-4" />
            {unread
              ? t("messaging.chat.markRead", "Marquer comme lu")
              : t("messaging.chat.markUnread", "Marquer comme non lu")}
          </button>
          <button type="button" className={item} onClick={run("favorite")}>
            <FontAwesomeIcon icon={conv.favori ? faStarRegular : faStar} className="w-4" />
            {conv.favori
              ? t("messaging.common.removeFavorite", "Retirer des favoris")
              : t("messaging.common.addFavorite", "Ajouter aux favoris")}
          </button>
          <button type="button" className={`${item} text-red-600`} onClick={run("delete")}>
            <FontAwesomeIcon icon={faTrashCan} className="w-4" />
            {t("messaging.chat.deleteChat", "Supprimer la discussion")}
          </button>
        </div>
      )}
    </div>
  );
};

const ConversationList = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRefresh,
  loading,
  error,
  myId,
  isDark,
  themeColors,
  narrow = false,
  filter = "all",
  onFilterChange,
  onAction,
  trash,
  trashLoading,
  onTrashAction,
}) => {
  const { t, language } = useTranslation();
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();

  // Chip badges count only conversations with unread messages (never totals,
  // which become noise with many conversations); the trash shows no badge.
  const counts = useMemo(() => {
    const c = { trash: 0 };
    CONVERSATION_FILTERS.forEach((f) => {
      if (f.id !== "trash") {
        c[f.id] = conversations.filter(
          (conv) =>
            isUnreadConversation(conv) &&
            conversationMatchesFilter(conv, f.id, myId),
        ).length;
      }
    });
    return c;
  }, [conversations, myId]);

  const filtered = useMemo(
    () =>
      conversations.filter(
        (c) =>
          // the open conversation stays listed (opening it marks it read)
          (c.id === activeId || conversationMatchesFilter(c, filter, myId)) &&
          (!term || matchesSearch(c, term, myId, t)),
      ),
    [conversations, filter, term, myId, activeId, t],
  );

  const chipsRef = useRef(null);
  const selectFilter = useCallback(
    (id, el) => {
      onFilterChange?.(id);
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    },
    [onFilterChange],
  );

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  return (
    <div
      className={`flex flex-col h-full ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
      >
        <h2 className="text-lg font-semibold">
          {t("messaging.conversations.title", "Discussions")}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            title={t("messaging.common.refresh", "Actualiser")}
            aria-label={t("messaging.common.refresh", "Actualiser")}
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={loading ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: themeColors.primary }}
            title={t("messaging.common.newMessage", "Nouveau message")}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            <span className="hidden sm:inline">
              {t("messaging.common.newMessage", "Nouveau message")}
            </span>
          </button>
        </div>
      </div>
      <div className="px-3 pt-2">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className={muted} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              filter === "trash"
                ? t("messaging.conversations.searchTrash", "Rechercher dans la corbeille")
                : t("messaging.conversations.searchChats", "Rechercher une discussion")
            }
            className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("messaging.common.clear", "Effacer")}
              className={muted}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>
      {/* Filter chips: horizontal scroll on narrow screens */}
      <div
        ref={chipsRef}
        className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label={t("messaging.conversations.filterChats", "Filtrer les discussions")}
      >
        {CONVERSATION_FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id] || 0;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-filter={f.id}
              onClick={(e) => selectFilter(f.id, e.currentTarget)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 border transition-colors ${
                active
                  ? "text-white border-transparent"
                  : isDark
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
              style={active ? { backgroundColor: themeColors.primary } : undefined}
            >
              {f.id === "trash" && <FontAwesomeIcon icon={faTrashCan} style={{ fontSize: 11 }} />}
              {t(f.labelKey, f.label)}
              {count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                    active
                      ? "bg-white/25 text-white"
                      : isDark
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid={`count-${f.id}`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="mx-3 mb-2 p-2 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span className="flex-1">{error}</span>
        </div>
      )}
      {filter === "trash" ? (
        <TrashList
          trash={trash}
          loading={trashLoading}
          search={term}
          myId={myId}
          isDark={isDark}
          themeColors={themeColors}
          onAction={onTrashAction}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className={`p-6 text-center text-sm ${muted}`}>
              <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin mr-2" />
              {t("messaging.common.loading", "Chargement…")}
            </div>
          ) : filtered.length === 0 ? (
            <div className={`p-6 text-center text-sm ${muted}`}>
              {search
                ? t(
                    "messaging.conversations.noSearchResults",
                    "Aucune discussion ne correspond à votre recherche.",
                  )
                : emptyText(filter, t)}
            </div>
          ) : (
            filtered.map((c) => {
              const preview = previewOf(c, myId, t);
              const active = c.id === activeId;
              const unread = isUnreadConversation(c);
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  data-conv-id={c.id}
                  onClick={() => onSelect(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(c);
                    }
                  }}
                  className={`group w-full flex items-center gap-3 px-3 py-3 text-left border-b cursor-pointer transition-colors outline-none ${isDark ? "border-gray-800" : "border-gray-100"} ${
                    active
                      ? isDark
                        ? "bg-gray-800"
                        : "bg-blue-50"
                      : isDark
                        ? "hover:bg-gray-800/60 focus:bg-gray-800/60"
                        : "hover:bg-gray-50 focus:bg-gray-50"
                  }`}
                >
                  <ConversationAvatar
                    conv={c}
                    myId={myId}
                    themeColor={themeColors.primary}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`truncate ${unread ? "font-semibold" : "font-medium"}`}
                        >
                          {conversationName(c, myId, t)}
                        </span>
                        <ConversationBadge conv={c} isDark={isDark} />
                      </span>
                      <span
                        className={`text-xs flex-shrink-0 ${unread ? "font-semibold" : muted}`}
                        style={unread ? { color: themeColors.primary } : undefined}
                      >
                        {formatListDate(
                          c.dernierMessage?.date || c.lastMessageAt || c.createdAt,
                          t,
                          language,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span
                        className={`text-sm truncate ${preview.italic ? "italic" : ""} ${unread ? (isDark ? "text-gray-200" : "text-gray-800") : muted}`}
                      >
                        {preview.text}
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        {isFavoriteConversation(c) && (
                          <span
                            title={
                              c.favori
                                ? t("messaging.conversations.favoriteChat", "Discussion favorite")
                                : t(
                                    "messaging.conversations.containsFavorite",
                                    "Contient un message favori",
                                  )
                            }
                          >
                            <FontAwesomeIcon
                              icon={faStar}
                              className={c.favori ? "text-amber-400" : muted}
                              style={{ fontSize: 11 }}
                            />
                          </span>
                        )}
                        {c.muted && (
                          <FontAwesomeIcon
                            icon={faBellSlash}
                            className={muted}
                            style={{ fontSize: 12 }}
                          />
                        )}
                        {unread && (
                          <span
                            className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                            style={{ backgroundColor: themeColors.primary }}
                            data-testid="unread-badge"
                          >
                            {c.nonLus > 0 ? (c.nonLus > 99 ? "99+" : c.nonLus) : ""}
                          </span>
                        )}
                        {onAction && (
                          <RowMenu conv={c} isDark={isDark} narrow={narrow} onAction={onAction} />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
