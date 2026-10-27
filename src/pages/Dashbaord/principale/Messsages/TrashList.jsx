import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBan,
  faComments,
  faRotateLeft,
  faStar,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { ConversationAvatar, ConversationBadge } from "./ConversationList";
import {
  attachmentLabel,
  conversationName,
  deletedLabel,
  formatListDate,
  fullName,
} from "./chatUtils";
import { dateMs } from "./messageUtils";
import { useTranslation } from "../../../../hooks/useTranslation";

/** One list of the trash: deleted conversations and messages, most recent deletion first. */
const trashItems = (trash, search, myId, t) => {
  const items = [
    ...(trash?.conversations || []).map((c) => ({
      kind: "conversation",
      id: c.id,
      date: c.supprimeLe,
      title: conversationName(c, myId, t),
      text: c.dernierMessage
        ? c.dernierMessage.supprime
          ? deletedLabel(t)
          : c.dernierMessage.contenu || ""
        : "",
      data: c,
    })),
    ...(trash?.messages || []).map((m) => ({
      kind: "message",
      id: m.id,
      date: m.supprimeLe || m.date,
      title: m.conversationTitre || t("messaging.common.message", "Message"),
      text:
        (m.contenu || "").trim() || (m.medias?.length ? attachmentLabel(t) : ""),
      data: m,
    })),
  ];
  const filtered = search
    ? items.filter((i) =>
        `${i.title} ${i.text}`.toLowerCase().includes(search),
      )
    : items;
  return filtered.sort((a, b) => dateMs(b.date) - dateMs(a.date));
};

const TrashList = ({ trash, loading, search, myId, isDark, themeColors, onAction }) => {
  const { t, language } = useTranslation();
  const items = useMemo(
    () => trashItems(trash, search, myId, t),
    [trash, search, myId, t],
  );
  const total = (trash?.conversations?.length || 0) + (trash?.messages?.length || 0);
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const actionBtn = `flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors`;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b text-xs ${isDark ? "border-gray-800 text-gray-400" : "border-gray-100 text-gray-500"}`}
      >
        <span className="min-w-0">
          {t(
            "messaging.trash.info",
            "Les éléments supprimés pour vous restent ici jusqu'à leur suppression définitive.",
          )}
        </span>
        <button
          type="button"
          onClick={() => onAction("empty")}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="empty-trash"
        >
          <FontAwesomeIcon icon={faTrashCan} />
          {t("messaging.trash.empty", "Vider la corbeille")}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && total === 0 ? (
          <div className={`p-6 text-center text-sm ${muted}`}>
            <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin mr-2" />
            {t("messaging.common.loading", "Chargement…")}
          </div>
        ) : items.length === 0 ? (
          <div className={`p-6 text-center text-sm ${muted}`}>
            {search
              ? t(
                  "messaging.trash.noSearchResults",
                  "Aucun élément de la corbeille ne correspond à votre recherche.",
                )
              : t("messaging.trash.isEmpty", "La corbeille est vide.")}
          </div>
        ) : (
          items.map((item) => {
            const isConv = item.kind === "conversation";
            const m = item.data;
            const sender = isConv
              ? null
              : m.expediteurId === myId
                ? t("messaging.common.you", "Vous")
                : fullName({ prenom: m.expediteurPrenom, nom: m.expediteurNom }, t);
            return (
              <div
                key={`${item.kind}-${item.id}`}
                data-trash-kind={item.kind}
                data-trash-id={item.id}
                className={`flex items-start gap-3 px-3 py-3 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}
              >
                {isConv ? (
                  <ConversationAvatar
                    conv={m}
                    myId={myId}
                    size={40}
                    themeColor={themeColors.primary}
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-500"}`}
                  >
                    <FontAwesomeIcon icon={faComments} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate font-medium">{item.title}</span>
                      {isConv && <ConversationBadge conv={m} isDark={isDark} />}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${muted}`}>
                      {formatListDate(item.date, t, language)}
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${muted}`}>
                    {isConv
                      ? m.reapparue
                        ? t(
                            "messaging.trash.deletedChatHistory",
                            "Discussion supprimée · historique antérieur",
                          )
                        : t("messaging.trash.deletedChat", "Discussion supprimée")
                      : t("messaging.trash.messageFrom", "Message de {{sender}}", { sender })}
                    {!isConv &&
                      m.supprimePourTous &&
                      t("messaging.trash.deletedForEveryone", " · supprimé pour tout le monde")}
                    {!isConv && m.favori && (
                      <FontAwesomeIcon icon={faStar} className="ml-1 text-amber-400" style={{ fontSize: 10 }} />
                    )}
                  </div>
                  {item.text && (
                    <div
                      className={`text-sm truncate mt-0.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {!isConv && m.supprimePourTous && (
                        <FontAwesomeIcon icon={faBan} className="mr-1 opacity-60" style={{ fontSize: 11 }} />
                      )}
                      {item.text}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onAction(item.kind, m, "restore")}
                      className={`${actionBtn} ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                      data-testid="trash-restore"
                    >
                      <FontAwesomeIcon icon={faRotateLeft} />
                      {t("messaging.trash.restore", "Restaurer")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction(item.kind, m, "purge")}
                      className={`${actionBtn} border-red-200 text-red-600 ${isDark ? "hover:bg-red-900/30 border-red-900" : "hover:bg-red-50"}`}
                      data-testid="trash-purge"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                      {t("messaging.trash.purge", "Supprimer définitivement")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TrashList;
