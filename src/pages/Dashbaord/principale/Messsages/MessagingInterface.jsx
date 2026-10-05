import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageDetailPanel from "./MessageDetailPanel";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";
import { useAuth } from "../../../../context/AuthContext";
import { useSelector } from "react-redux";
import { messageService } from "../../../../services/MessageService";
import {
  useMessageSocket,
  refreshUnreadMessageCount,
} from "../../../../hooks/useMessageSocket";
import DeleteMessageDialog from "./DeleteMessageDialog";
import {
  AttachButton,
  AttachmentPreviewList,
  MessageAttachments,
  MessagePreviewText,
} from "./MessageAttachments";
import { useMessageAttachments, MAX_ATTACHMENTS } from "./messageMedia";
import { dateMs, parseMessageDate } from "./messageUtils";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faChevronRight,
  faCircleExclamation,
  faMagnifyingGlass,
  faMessage,
  faPaperPlane,
  faPlus,
  faRotateLeft,
  faSpinner,
  faInbox,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../utils/faIconAdapter";
const Inbox = asIconComponent(faInbox);
const SendHorizontal = asIconComponent(faPaperPlane);
const Trash2 = asIconComponent(faTrashCan);
const ROLE_LABELS = {
  PROFESSEUR: "Professeur",
  ELEVE: "Élève",
  PARENT: "Parent",
  REPETITEUR: "Répétiteur",
};
// MessageDto users carry `typeUtilisateur` (PROFESSEUR/ELEVE/PARENT/REPETITEUR).
const roleLabel = (u) =>
  ROLE_LABELS[(u?.typeUtilisateur || "").toUpperCase()] || "";

const toUser = (u) => ({
  id: u?.id,
  nom: u?.nom,
  prenom: u?.prenom,
  email: u?.email,
  role: roleLabel(u),
  type: u?.type,
  typeUtilisateur: u?.typeUtilisateur,
});

/**
 * MessageDto (REST lists / WS pushes) or Messages (POST response) -> UI shape.
 * Read state is from the caller's perspective: own messages are always read.
 */
const transformMessage = (msg, myId, readIds) => ({
  id: msg.id,
  objet: msg.objet || "Sans objet",
  contenu: msg.contenu || "",
  dateCreation: msg.dateCreation,
  dateModification: msg.dateModification,
  etat: msg.etat,
  expediteur: toUser(msg.expediteur),
  destinataires: (msg.destinataires || []).map(toUser),
  medias: Array.isArray(msg.medias) ? msg.medias : [],
  read:
    (readIds && readIds.has(msg.id)) ||
    (!!myId && msg.expediteur?.id === myId) ||
    (msg.lu !== undefined && msg.lu !== null ? !!msg.lu : true),
  starred: !!msg.favori,
  supprimePourTous: !!msg.supprimePourTous,
  dateSuppression: msg.dateSuppression || null,
  classes: [],
  isGeneral: false,
});
const MobileMessagingInterface = ({
  messages,
  isDark,
  currentUser,
  formatDate,
  getUserInitials,
  getUserDisplay,
  handleRefresh,
  loading,
  error,
  setError,
  filterType,
  setFilterType,
  messageCounts,
  showCompose,
  setShowCompose,
  newMessage,
  setNewMessage,
  recipientSearch,
  setRecipientSearch,
  addRecipient,
  removeRecipient,
  handleEmailInput,
  selectedClasses,
  setSelectedClasses,
  isGeneralMessage,
  setIsGeneralMessage,
  ccRecipients,
  setCcRecipients,
  setShowRecipientSelector,
  showRecipientSelector,
  filteredUsers,
  fetchMessages,
  setLoading,
  themeColors,
  handleMarkAsRead,
  onDeleteMessage,
  onDeleteConversation,
  handleRestoreMessage,
  handleEmptyTrash,
  onMessageSent,
  markLiveArrivalsRead,
}) => {
  const [selectedThread, setSelectedThread] = useState(null);
  const attachments = useMessageAttachments();
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef(null);
  const filteredMessages = messages.filter(
    (msg) =>
      msg.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserDisplay(msg.partner || msg.expediteur)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );
  useEffect(() => {
    if (selectedThread && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [selectedThread]);

  // Keep the open thread in sync with live data (socket pushes, deletions).
  useEffect(() => {
    if (!selectedThread) return;
    const updated = messages.find(
      (m) => m.conversationKey === selectedThread.conversationKey,
    );
    if (!updated) {
      setSelectedThread(null); // whole conversation deleted
      return;
    }
    if (updated !== selectedThread) setSelectedThread(updated);
    // Messages pushed live into the open thread are read on arrival.
    markLiveArrivalsRead?.(updated);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeThread = () => {
    attachments.clear();
    setReplyText("");
    setSelectedThread(null);
  };
  const canSendReply =
    !sendingReply &&
    !attachments.uploading &&
    !attachments.hasErrors &&
    (!!replyText.trim() || attachments.medias.length > 0);
  const handleSendReply = async () => {
    if (!canSendReply || !selectedThread) return;
    setSendingReply(true);
    try {
      const userId = localStorage.getItem("userId");
      const recipientSource = selectedThread.isBroadcast
        ? (selectedThread.destinataires || []).filter((d) => d.id !== userId)
        : [selectedThread.partner || selectedThread.expediteur].filter(Boolean);
      const sent = await messageService.sendMessage({
        contenu: replyText,
        objet: `Re: ${(selectedThread.objet || "Sans objet").replace(/^(Re:\s*)+/i, "")}`,
        destinataires: recipientSource.map((d) => ({
          type: "utilisateur",
          id: d.id,
          nom: d.nom || "",
          prenom: d.prenom || "",
          email: d.email || "",
        })),
        ...(attachments.medias.length > 0 && { medias: attachments.medias }),
      });
      setReplyText("");
      attachments.clear();
      // Shown immediately from the response; the socket push dedupes by id.
      onMessageSent?.(sent);
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err?.message || "Erreur lors de l'envoi de la réponse");
    } finally {
      setSendingReply(false);
    }
  };
  const filterTabs = [
    {
      id: "all",
      label: "Inbox",
      icon: Inbox,
      count: messageCounts?.unreadReceived,
    },
    {
      id: "sent",
      label: "Envoyés",
      icon: SendHorizontal,
      count: messageCounts?.sent,
    },
    {
      id: "trash",
      label: "Corbeille",
      icon: Trash2,
      count: messageCounts?.trash,
    },
  ];
  if (selectedThread) {
    return (
      <div className="fixed inset-0 z-[1002] bg-white dark:bg-slate-950 flex flex-col">
        <header className="px-4 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={closeThread}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{
                  fontSize: 24,
                }}
              />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
              {getUserInitials(
                selectedThread.partner || selectedThread.expediteur,
              )}
            </div>
            <div>
              <h3 className="text-sm font-black dark:text-white leading-tight">
                {getUserDisplay(
                  selectedThread.partner || selectedThread.expediteur,
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold truncate max-w-[180px]">
                {selectedThread.objet}
              </p>
            </div>
          </div>
          <button
            className="p-2 text-gray-400 hover:text-red-500"
            onClick={() =>
              filterType === "trash"
                ? handleRestoreMessage(selectedThread)
                : onDeleteConversation(selectedThread)
            }
            title={
              filterType === "trash"
                ? "Restaurer la conversation"
                : "Supprimer la conversation"
            }
          >
            <FontAwesomeIcon
              icon={filterType === "trash" ? faRotateLeft : faTrashCan}
              style={{
                fontSize: 20,
              }}
            />
          </button>
        </header>
        <div
          className="flex-1 overflow-y-auto p-4 pt-6 space-y-4"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 20px)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 20px)",
          }}
        >
          {selectedThread.thread?.map((msg, idx) => {
            const isMe =
              msg.expediteur?.id ===
              (currentUser?.id || localStorage.getItem("userId"));
            return (
              <div
                key={msg.id || idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" : "bg-gray-100 dark:bg-slate-800 dark:text-white rounded-tl-none"}`}
                >
                  {(() => {
                    const sep = msg.contenu?.indexOf(
                      "--- Message original ---",
                    );
                    const newPart =
                      sep > -1 ? msg.contenu.slice(0, sep).trim() : msg.contenu;
                    const quotedPart =
                      sep > -1 ? msg.contenu.slice(sep).trim() : null;
                    return (
                      <>
                        {newPart && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {newPart}
                          </p>
                        )}
                        {quotedPart && (
                          <p
                            className={`text-xs mt-2 pt-2 border-t opacity-60 whitespace-pre-wrap ${isMe ? "border-blue-400" : "border-gray-300"}`}
                          >
                            {quotedPart}
                          </p>
                        )}
                      </>
                    );
                  })()}
                  <MessageAttachments
                    medias={msg.medias}
                    isDark={isDark}
                    className={msg.contenu ? "mt-2" : ""}
                  />
                  <div
                    className={`flex items-center justify-end gap-2 text-[10px] mt-1 opacity-60 ${isMe ? "text-blue-100" : "text-gray-500"}`}
                  >
                    <span>{formatDate(msg.dateCreation)}</span>
                    {filterType !== "trash" && (
                      <button
                        onClick={() => onDeleteMessage(msg)}
                        aria-label="Supprimer ce message"
                        className="p-1 hover:opacity-100"
                      >
                        <FontAwesomeIcon
                          icon={faTrashCan}
                          style={{ fontSize: 10 }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <footer
          className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5"
          style={{
            paddingBottom: "calc(28px + env(safe-area-inset-bottom, 16px))",
          }}
        >
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
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-[24px]">
            <AttachButton
              onFiles={(files) => {
                if (attachments.addFiles(files) > 0) {
                  setError(
                    `Maximum ${MAX_ATTACHMENTS} pièces jointes par message.`,
                  );
                }
              }}
              disabled={
                sendingReply || attachments.items.length >= MAX_ATTACHMENTS
              }
              className="p-3 rounded-full text-gray-500 dark:text-gray-300 disabled:opacity-40"
            />
            <input
              type="text"
              placeholder="Écrire un message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
              className="flex-1 bg-transparent py-2 px-3 outline-none dark:text-white text-sm"
            />
            <button
              onClick={handleSendReply}
              disabled={!canSendReply}
              className={`p-3 rounded-full shadow-lg transition-all ${canSendReply ? "bg-blue-600 text-white shadow-blue-500/30" : "bg-gray-200 dark:bg-slate-700 text-gray-400"}`}
            >
              {sendingReply || attachments.uploading ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin"
                  style={{
                    fontSize: 20,
                  }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  style={{
                    fontSize: 20,
                  }}
                />
              )}
            </button>
          </div>
        </footer>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 pb-32">
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-black dark:text-white">Messages</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={`text-gray-500 ${loading ? "animate-spin" : ""}`}
              style={{
                fontSize: 18,
              }}
            />
          </button>
        </div>
        <div className="relative mb-4">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            style={{
              fontSize: 20,
            }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-3 pl-12 pr-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white text-sm"
          />
        </div>
        {filterType === "trash" && messages.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="mb-3 w-full py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
          >
            Vider la corbeille
          </button>
        )}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400"}`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="text-red-500 flex-shrink-0"
            style={{
              fontSize: 16,
            }}
          />
          <p className="text-xs text-red-600 dark:text-red-400 flex-1">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              handleRefresh();
            }}
            className="text-xs font-bold text-red-600 dark:text-red-400 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && messages.length === 0 && (
        <div className="py-20 text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="mx-auto text-blue-500 animate-spin mb-4"
            style={{
              fontSize: 32,
            }}
          />
          <p className="text-sm text-gray-500">Chargement des messages...</p>
        </div>
      )}

      {!loading || messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {filteredMessages.map((msg, idx) => (
            <motion.button
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: idx * 0.03,
              }}
              key={msg.id || idx}
              onClick={() => {
                setSelectedThread(msg);
                const threadIds = msg.thread
                  ? msg.thread
                      .filter(
                        (m) => !m.read && m.expediteur?.id !== currentUser?.id,
                      )
                      .map((m) => m.id)
                  : !msg.read && msg.expediteur?.id !== currentUser?.id
                    ? [msg.id]
                    : [];
                threadIds.forEach((id) => handleMarkAsRead(id, true));
              }}
              className="w-full flex items-center space-x-4 p-4 rounded-[28px] bg-white dark:bg-slate-800 shadow-sm border border-transparent hover:border-blue-500/20 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-base group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                  {getUserInitials(msg.partner || msg.expediteur)}
                </div>
                {!msg.read && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4
                    className={`text-sm truncate pr-2 ${!msg.read ? "font-black dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300"}`}
                  >
                    {getUserDisplay(msg.partner || msg.expediteur)}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                    {formatDate(msg.dateCreation)}
                  </span>
                </div>
                <h5 className="text-[11px] font-bold text-blue-600 truncate">
                  {msg.objet}
                </h5>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  <MessagePreviewText
                    contenu={msg.contenu}
                    medias={msg.medias}
                  />
                </p>
              </div>
              {msg.isConversation && (
                <div className="flex items-center space-x-1 text-gray-300">
                  <span className="text-[10px] font-bold text-gray-400">
                    {msg.thread?.length}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    style={{
                      fontSize: 14,
                    }}
                  />
                </div>
              )}
            </motion.button>
          ))}

          {filteredMessages.length === 0 && !loading && (
            <div className="py-20 text-center">
              <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faMessage}
                  className="text-gray-400"
                  style={{
                    fontSize: 40,
                  }}
                />
              </div>
              <h4 className="font-bold dark:text-white mb-1">Aucun message</h4>
              <p className="text-xs text-gray-500">
                {searchTerm
                  ? "Aucun résultat pour cette recherche"
                  : "Vos conversations apparaîtront ici"}
              </p>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
      >
        <FontAwesomeIcon
          icon={faPlus}
          style={{
            fontSize: 32,
          }}
        />
      </button>

      {showCompose && (
        <ComposeModal
          isDark={isDark}
          themeColors={themeColors}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          loading={loading}
          recipientSearch={recipientSearch}
          setRecipientSearch={setRecipientSearch}
          addRecipient={addRecipient}
          removeRecipient={removeRecipient}
          handleEmailInput={handleEmailInput}
          setShowCompose={setShowCompose}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          isGeneralMessage={isGeneralMessage}
          setIsGeneralMessage={setIsGeneralMessage}
          currentUser={currentUser}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          setShowRecipientSelector={setShowRecipientSelector}
          onMessageSent={onMessageSent}
          setError={setError}
          setLoading={setLoading}
          fetchMessages={fetchMessages}
        />
      )}

      {showRecipientSelector && (
        <RecipientSelectorModal
          isDark={isDark}
          filteredUsers={filteredUsers}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          setShowRecipientSelector={setShowRecipientSelector}
          getUserInitials={getUserInitials}
          addRecipient={addRecipient}
        />
      )}
    </div>
  );
};
const MessagingInterface = ({
  isDark = false,
  currentTheme = "blue",
  colorSchemes = {
    blue: {
      primary: "#1a73e8",
      light: "#e8f0fe",
      dark: "#1557b0",
    },
    green: {
      primary: "#34a853",
      light: "#e6f4ea",
      dark: "#137333",
    },
    red: {
      primary: "#ea4335",
      light: "#fce8e6",
      dark: "#c5221f",
    },
  },
  onClose,
  selectedConversation,
  userRole = "ADMIN",
}) => {
  const { user: currentUser } = useAuth(); // Use the useAuth hook to retrieve the current user
  const [allMessages, setAllMessages] = useState([]);
  const fetchSeqRef = useRef(0);
  const hasDataRef = useRef(false);
  // Persistent set of message IDs the current user has already read this session.
  // Lives outside allMessages so it survives every fetchMessages refetch.
  const readIdsRef = useRef(new Set());
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  // Tracks background polling refreshes — does NOT trigger the list spinner
  // so the UI doesn't blink every 10 seconds.
  const isBackgroundFetchRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [trashMessages, setTrashMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isGeneralMessage, setIsGeneralMessage] = useState(false);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [ccRecipients, setCcRecipients] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const themeColors = colorSchemes[currentTheme] || colorSchemes.blue;
  const [newMessage, setNewMessage] = useState({
    destinataires: [],
    contenu: "",
    objet: "",
    expediteur: currentUser,
  });
  const parseMessageContent = (contenu) => {
    const subjectMatch = contenu.match(/\[([^\]]+)\]/);
    if (subjectMatch) {
      const subject = subjectMatch[1];
      const messageBody = contenu.replace(subjectMatch[0], "").trim();
      return {
        subject,
        messageBody,
      };
    }
    return {
      subject: "Sans objet",
      messageBody: contenu,
    };
  };
  const fetchUnreadCount = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    // Shared store: also drives the dashboard Sidebar / bottom-nav badges.
    const count = await refreshUnreadMessageCount(userId);
    setUnreadCount(count);
  }, []);
  const fetchMessages = useCallback(
    async (background = false) => {
      // Always the logged-in user's own mailbox. (Parents used to load their
      // selected child's mailbox here, but every other step — grouping,
      // read/unread, replies — runs as the parent, so the inbox came out empty.)
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const seq = ++fetchSeqRef.current;

      // Only show the full-screen spinner on the very first load (no data yet).
      // Background polls and manual refreshes update silently.
      if (!background && !hasDataRef.current) {
        setLoading(true);
      }
      try {
        const accessToken = localStorage.getItem("accessToken");
        const transform = (msg) =>
          transformMessage(msg, userId, readIdsRef.current);

        // Fetch sent, received, and trash messages
        const [sentResponse, receivedResponse, trashResponse] =
          await Promise.all([
            fetch(
              `${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/sent`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            ),
            fetch(
              `${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/received`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            ),
            fetch(
              `${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/trash`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            ),
          ]);
        if (!sentResponse.ok || !receivedResponse.ok) {
          throw new Error("Failed to fetch messages");
        }
        const [sentData, receivedData] = await Promise.all([
          sentResponse.json(),
          receivedResponse.json(),
        ]);

        // A newer request has already started — this one's result is stale, discard it.
        if (seq !== fetchSeqRef.current) return;

        // Handle trash messages separately
        let trashData = [];
        if (trashResponse.ok) {
          trashData = await trashResponse.json();
          setTrashMessages(trashData.map(transform));
        }
        // Dedupe by id (a message sent to yourself is in both lists — keep the received copy).
        const byId = new Map();
        [...sentData, ...receivedData]
          .map(transform)
          .forEach((m) => byId.set(m.id, m));
        const allMessages = Array.from(byId.values());

        // Preserve read-state for messages the user has already opened this session.
        // readIdsRef is a stable ref that survives every refetch, so even if the
        // backend hasn't persisted the status yet (race condition) the badge won't
        // flash back. When the backend finally confirms, it will return lu=true and
        // the ref check becomes a no-op.
        setAllMessages(
          allMessages.map((m) => ({
            ...m,
            read: readIdsRef.current.has(m.id) ? true : m.read,
          })),
        );
        hasDataRef.current = true;
        setError(null);
        fetchUnreadCount();
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (seq === fetchSeqRef.current) {
          setError("Erreur lors du chargement des messages");
        }
      } finally {
        if (seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    },
    // Stable identity: depending on allMessages.length re-ran the mount effect
    // (a full refetch) every time a message arrived or was deleted.
    [fetchUnreadCount],
  );

  // Groups by conversation PARTNER (the other person), not by subject — so all
  // messages exchanged with the same person (sent + received, any subject)
  // merge into one continuous thread, WhatsApp-style.
  const groupMessagesByConversation = (messages) => {
    const userId = localStorage.getItem("userId");
    const conversations = {};
    const partners = {};
    messages.forEach((msg) => {
      const isSender = msg.expediteur?.id === userId;
      const others = (msg.destinataires || []).filter((d) => d.id !== userId);
      let key;
      let partner;
      if (isSender && others.length === 1) {
        partner = others[0];
        key = partner.id;
      } else if (!isSender) {
        partner = msg.expediteur;
        key = partner?.id || `unknown:${msg.id}`;
      } else if (others.length === 0) {
        partner = msg.expediteur;
        key = `self:${msg.id}`;
      } else {
        // Sender with several recipients (broadcast/general message) — these
        // don't have a single "other person", keep them grouped by recipient set.
        const names = others.map((d) =>
          `${d.prenom || ""} ${d.nom || ""}`.trim() || d.email || "?",
        );
        key = `broadcast:${others
          .map((d) => d.id)
          .sort()
          .join(",")}`;
        partner = {
          id: key,
          nom:
            names.length <= 2
              ? names.join(", ")
              : `${names[0]} et ${names.length - 1} autres`,
          prenom: "",
        };
      }
      if (!conversations[key]) conversations[key] = [];
      conversations[key].push(msg);
      if (!partners[key] || (!partners[key].nom && partner?.nom)) {
        partners[key] = partner;
      }
    });
    return Object.entries(conversations).map(([key, thread]) => {
      thread.sort((a, b) => dateMs(a.dateCreation) - dateMs(b.dateCreation));
      const latestMessage = thread[thread.length - 1];
      const unreadCount = thread.filter(
        (m) => !m.read && m.expediteur?.id !== userId,
      ).length;
      return {
        ...latestMessage,
        thread,
        conversationKey: key,
        isBroadcast: key.startsWith("broadcast:"),
        isConversation: thread.length > 1,
        partner: partners[key],
        // Conversation-level read state: unread while any RECEIVED message in it is unread.
        read: unreadCount === 0,
        unreadCount,
      };
    });
  };
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Real-time WebSocket updates (no polling) ──────────────────────────
  // /topic/messages/{userId}: NEW_MESSAGE / MESSAGE_RESTORED are upserted,
  // MESSAGE_DELETED removed. After a reconnect: ONE re-fetch of everything.
  const socketUserId = localStorage.getItem("userId");

  const refreshTrash = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const list = await messageService.getTrash(userId);
      setTrashMessages(
        list.map((m) => transformMessage(m, userId, readIdsRef.current)),
      );
    } catch (e) {
      // trash is secondary — keep the current list
    }
  }, []);

  const upsertMessage = useCallback((raw) => {
    if (!raw?.id) return;
    const myId = localStorage.getItem("userId");
    const fresh = transformMessage(raw, myId, readIdsRef.current);
    setAllMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === fresh.id);
      if (idx === -1) return [fresh, ...prev];
      const next = [...prev];
      next[idx] = {
        ...prev[idx],
        ...fresh,
        // never flip an already-read message back to unread
        read: prev[idx].read || fresh.read,
      };
      return next;
    });
    setTrashMessages((prev) => prev.filter((m) => m.id !== fresh.id));
  }, []);

  // POST /messages(/group) response — upsert when it looks like a message.
  const onMessageSent = useCallback(
    (sent) => {
      (Array.isArray(sent) ? sent : [sent]).forEach((m) => {
        if (m?.id && m.expediteur && Array.isArray(m.destinataires)) {
          upsertMessage(m);
        }
      });
    },
    [upsertMessage],
  );

  // Incoming unread messages pushed live: marked read if their conversation is open.
  const liveUnreadRef = useRef(new Set());

  const handleSocketEvent = useCallback(
    (event) => {
      const msg = event?.message;
      if (!msg?.id) return;
      if (event.type === "NEW_MESSAGE" || event.type === "MESSAGE_RESTORED") {
        if (
          event.type === "NEW_MESSAGE" &&
          msg.lu === false &&
          msg.expediteur?.id !== localStorage.getItem("userId")
        ) {
          liveUnreadRef.current.add(msg.id);
        }
        upsertMessage(msg);
      } else if (event.type === "MESSAGE_DELETED") {
        setAllMessages((prev) => prev.filter((m) => m.id !== msg.id));
        refreshTrash();
      }
    },
    [upsertMessage, refreshTrash],
  );

  const handleSocketReconnect = useCallback(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  useMessageSocket(socketUserId, handleSocketEvent, handleSocketReconnect);
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);
  const handleRefresh = () => {
    setRefreshing(true);
    // Always use background=true so the list never replaces with a spinner
    fetchMessages(true).finally(() => {
      setRefreshing(false);
    });
  };
  const getMessageCounts = () => {
    const userId = localStorage.getItem("userId");

    // Deduplicate allMessages by id first
    const uniqueMessages = allMessages.filter(
      (msg, idx, self) => self.findIndex((m) => m.id === msg.id) === idx,
    );
    const receivedMessages = uniqueMessages.filter((msg) =>
      msg.destinataires.some((dest) => dest.id === userId),
    );
    const unreadReceived = receivedMessages.filter((msg) => !msg.read);
    const sentMessages = uniqueMessages.filter(
      (msg) => msg.expediteur.id === userId,
    );
    const unreadSent = sentMessages.filter((msg) => !msg.read);
    const starredMessages = uniqueMessages.filter((msg) => msg.starred);
    return {
      totalReceived: receivedMessages.length,
      unreadReceived: unreadReceived.length,
      all: unreadReceived.length,
      // inbox badge = unread received only
      unread: unreadReceived.length,
      sent: unreadSent.length,
      // sent badge = unread by recipient only
      starred: starredMessages.length,
      trash: trashMessages.length,
    };
  };
  const formatDate = (dateString) => {
    const date = parseMessageDate(dateString);
    if (!date) return "";
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("fr-FR", {
        weekday: "short",
      });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };
  const getUserInitials = (user) => {
    if (!user?.nom) return "?";
    const nom = user.nom || "";
    const prenom = user.prenom || "";
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  };
  const getUserDisplay = (user) => {
    if (user?.nom && user?.prenom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user?.email || user?.nom || "Unknown User";
  };
  const toggleMessageSelection = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };
  const handleSendMessage = async () => {
    if (!newMessage.contenu.trim() || newMessage.destinataires.length === 0) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      setNewMessage({
        destinataires: [],
        contenu: "",
        objet: "",
        expediteur: currentUser,
      });
      setSelectedClasses([]);
      setIsGeneralMessage(false);
      setCcRecipients([]);
      setShowCompose(false);
      setError(null);
      // WebSocket push handles the update; background refresh as safety net
      fetchMessages(true);
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
    }
  };
  const handleMarkAsRead = async (messageId, newRead) => {
    const userId = localStorage.getItem("userId");
    // Track in persistent ref so future refetches honour this choice
    if (newRead) {
      readIdsRef.current.add(messageId);
    } else {
      readIdsRef.current.delete(messageId);
    }
    // Optimistically update the message read state
    setAllMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              read: newRead,
            }
          : msg,
      ),
    );
    try {
      await messageService.setStatutLu(messageId, userId, newRead);
      fetchUnreadCount();
    } catch (e) {
      console.warn("Could not update read status:", e.message);
      // Revert both the ref and the state on failure
      if (newRead) {
        readIdsRef.current.delete(messageId);
      } else {
        readIdsRef.current.add(messageId);
      }
      setAllMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                read: !newRead,
              }
            : msg,
        ),
      );
    }
  };

  // Mark as read locally only (no API call) — used for sent messages viewed by sender
  const markReadLocally = (messageId) => {
    readIdsRef.current.add(messageId);
    setAllMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              read: true,
            }
          : msg,
      ),
    );
  };
  // Accepts a conversation (grouped row), a single message, or a message id.
  const messagesOf = (target) => {
    if (!target) return [];
    if (typeof target === "string") {
      return [...allMessages, ...trashMessages].filter((m) => m.id === target);
    }
    return target.thread || [target];
  };
  // ── Deleting (per user) ──────────────────────────────────────────────
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Single message: the sender may delete for everyone; a recipient only for themself.
  const requestDeleteMessage = (msg) => {
    if (!msg?.id || String(msg.id).startsWith("temp-")) return;
    const mine = msg.expediteur?.id === localStorage.getItem("userId");
    setDeleteError(null);
    setDeleteRequest({
      kind: "message",
      messages: [msg],
      canEveryone: mine,
      title: "Supprimer ce message ?",
      description: mine
        ? "« Supprimer pour tout le monde » le retire aussi chez les destinataires. « Supprimer pour moi » le place uniquement dans votre corbeille."
        : "Le message sera retiré de votre messagerie et placé dans votre corbeille.",
    });
  };

  // Whole conversation(s): "everyone" only if the caller sent at least one message.
  const requestDeleteConversations = (targets) => {
    const msgs = targets
      .flatMap(messagesOf)
      .filter((m) => m?.id && !String(m.id).startsWith("temp-"));
    if (msgs.length === 0) return;
    const canEveryone = msgs.some(
      (m) => m.expediteur?.id === localStorage.getItem("userId"),
    );
    setDeleteError(null);
    setDeleteRequest({
      kind: "bulk",
      messages: msgs,
      canEveryone,
      title:
        targets.length > 1
          ? `Supprimer ${targets.length} conversations ?`
          : "Supprimer la conversation ?",
      description: canEveryone
        ? "« Supprimer pour tout le monde » retire aussi vos messages envoyés chez les destinataires (les messages reçus ne sont supprimés que pour vous)."
        : "Les messages seront retirés de votre messagerie et placés dans votre corbeille.",
    });
  };

  const confirmDelete = async (scope) => {
    if (!deleteRequest) return;
    const ids = deleteRequest.messages.map((m) => m.id);
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      if (deleteRequest.kind === "message") {
        await messageService.deleteMessage(ids[0], scope);
      } else {
        await messageService.bulkDelete(ids, scope);
      }
      const gone = new Set(ids);
      setAllMessages((prev) => prev.filter((m) => !gone.has(m.id)));
      setSelectedMessages(new Set());
      setDeleteRequest(null);
      refreshTrash();
      fetchUnreadCount();
    } catch (e) {
      // 403 etc: show the server's message
      setDeleteError(e?.message || "Impossible de supprimer.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeleteMessage = (target) => requestDeleteConversations([target]);

  const handleRestoreMessage = async (target) => {
    const ids = messagesOf(target).map((m) => m.id);
    const results = await Promise.allSettled(
      ids.map((id) => messageService.restoreMessage(id)),
    );
    const restored = new Set(
      ids.filter((_, i) => results[i].status === "fulfilled"),
    );
    setTrashMessages((prev) => prev.filter((msg) => !restored.has(msg.id)));
    const failure = results.find((r) => r.status === "rejected");
    if (failure) {
      setError(
        failure.reason?.message || "Erreur lors de la restauration du message",
      );
    }
    if (restored.size > 0) fetchMessages(true);
  };
  const handleBulkDelete = async () => {
    const selected = conversations.filter((c) => selectedMessages.has(c.id));
    if (filterType === "trash") {
      await Promise.all(selected.map((c) => handleRestoreMessage(c)));
      setSelectedMessages(new Set());
    } else {
      requestDeleteConversations(selected);
    }
  };
  // DELETE /messages/trash/cleanup permanently empties the CALLER's trash only.
  const handleEmptyTrash = async () => {
    if (
      !window.confirm(
        "Vider définitivement votre corbeille ? Cette action est irréversible.",
      )
    ) {
      return;
    }
    try {
      await messageService.emptyTrash();
      setTrashMessages([]);
    } catch (e) {
      console.error("Error emptying trash:", e);
      setError(e?.message || "Erreur lors du vidage de la corbeille");
    }
  };
  // Conversation-level read toggle: marks every unread received message as
  // read, or flags the latest received one as unread again.
  // Marks as read the live-pushed unread messages of the conversation the user has open.
  const markLiveArrivalsRead = (conversation) => {
    const pending = liveUnreadRef.current;
    if (!conversation || pending.size === 0) return;
    (conversation.thread || [conversation]).forEach((m) => {
      if (!pending.has(m.id)) return;
      pending.delete(m.id);
      if (!m.read) handleMarkAsRead(m.id, true);
    });
  };
  const handleMarkConversationRead = (conversation, read) => {
    const userId = localStorage.getItem("userId");
    const received = messagesOf(conversation).filter(
      (m) => m.expediteur?.id !== userId,
    );
    if (read) {
      received.filter((m) => !m.read).forEach((m) => handleMarkAsRead(m.id, true));
    } else if (received.length > 0) {
      handleMarkAsRead(received[received.length - 1].id, false);
    }
  };
  const toggleStarMessage = async (messageId, isStarred) => {
    const userId = localStorage.getItem("userId");
    const newStarred = !isStarred;
    setAllMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              starred: newStarred,
            }
          : msg,
      ),
    );
    try {
      await messageService.setStatutFavori(messageId, userId, newStarred);
    } catch (e) {
      console.warn("Could not update favori status:", e.message);
      setAllMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                starred: !newStarred,
              }
            : msg,
        ),
      );
    }
  };
  const addRecipient = (user) => {
    if (!newMessage.destinataires.some((dest) => dest.id === user.id)) {
      setNewMessage((prev) => ({
        ...prev,
        destinataires: [...prev.destinataires, user],
      }));
      setRecipientSearch("");
    }
  };
  const removeRecipient = (index) => {
    setNewMessage((prev) => ({
      ...prev,
      destinataires: prev.destinataires.filter((_, i) => i !== index),
    }));
  };
  const handleEmailInput = (email) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const emailUser = {
        id: `email_${Date.now()}`,
        nom: email.split("@")[0],
        email: email,
        role: "EXTERNAL",
        type: "repetiteur",
      };
      setNewMessage((prev) => ({
        ...prev,
        destinataires: [...prev.destinataires, emailUser],
      }));
      return true;
    }
    return false;
  };
  const messageCounts = getMessageCounts();
  const isMobile = useSelector((state) => state.ui.isMobile);

  // A conversation's content always carries its FULL merged history (sent +
  // received), no matter which tab (Inbox/Envoyés/Suivis) was used to find it —
  // the tab only changes which conversations are listed, never what's inside
  // them. (Desktop used to filter messages BEFORE grouping, so an Inbox thread
  // never showed your own replies and the same exchange lived in two places.)
  const conversations = useMemo(() => {
    const userId = localStorage.getItem("userId");
    if (filterType === "trash") {
      const grouped = groupMessagesByConversation([...trashMessages]);
      grouped.sort((a, b) => dateMs(b.dateCreation) - dateMs(a.dateCreation));
      if (!searchTerm) return grouped;
      const term = searchTerm.toLowerCase();
      return grouped.filter(
        (c) =>
          c.objet?.toLowerCase().includes(term) ||
          c.contenu?.toLowerCase().includes(term) ||
          getUserDisplay(c.partner).toLowerCase().includes(term),
      );
    }
    const allConversations = groupMessagesByConversation([...allMessages]);
    let filtered = allConversations;
    if (filterType === "all") {
      filtered = allConversations.filter((c) =>
        (c.thread || []).some((m) =>
          m.destinataires.some((d) => d.id === userId),
        ),
      );
    } else if (filterType === "sent") {
      filtered = allConversations.filter((c) =>
        (c.thread || []).some((m) => m.expediteur.id === userId),
      );
    } else if (filterType === "starred") {
      filtered = allConversations.filter((c) =>
        (c.thread || []).some((m) => m.starred),
      );
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          getUserDisplay(c.partner || c.expediteur)
            .toLowerCase()
            .includes(term) ||
          (c.thread || [c]).some(
            (m) =>
              m.objet?.toLowerCase().includes(term) ||
              m.contenu?.toLowerCase().includes(term),
          ),
      );
    }
    filtered.sort((a, b) => dateMs(b.dateCreation) - dateMs(a.dateCreation));
    return filtered;
  }, [allMessages, trashMessages, filterType, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the desktop detail panel in sync with fresh data (new replies, read state).
  useEffect(() => {
    if (!selectedMessage?.conversationKey) return;
    const fresh = conversations.find(
      (c) => c.conversationKey === selectedMessage.conversationKey,
    );
    if (fresh) {
      if (fresh !== selectedMessage) setSelectedMessage(fresh);
      // Messages pushed live into the open conversation are read on arrival.
      if (filterType !== "trash") markLiveArrivalsRead(fresh);
      return;
    }
    // Conversation no longer exists anywhere (deleted) -> close the panel.
    const known = new Set(
      [...allMessages, ...trashMessages].map((m) => m.id),
    );
    if (!messagesOf(selectedMessage).some((m) => known.has(m.id))) {
      setSelectedMessage(null);
    }
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps
  const deleteDialog = deleteRequest && (
    <DeleteMessageDialog
      isDark={isDark}
      title={deleteRequest.title}
      description={deleteRequest.description}
      canEveryone={deleteRequest.canEveryone}
      busy={deleteBusy}
      error={deleteError}
      onEveryone={() => confirmDelete("everyone")}
      onMe={() => confirmDelete("me")}
      onCancel={() => setDeleteRequest(null)}
    />
  );
  if (isMobile) {
    return (
      <>
      <MobileMessagingInterface
        messages={conversations}
        isDark={isDark}
        currentUser={currentUser}
        formatDate={formatDate}
        getUserInitials={getUserInitials}
        getUserDisplay={getUserDisplay}
        handleRefresh={handleRefresh}
        loading={loading}
        error={error}
        setError={setError}
        filterType={filterType}
        setFilterType={setFilterType}
        messageCounts={messageCounts}
        showCompose={showCompose}
        setShowCompose={setShowCompose}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        recipientSearch={recipientSearch}
        setRecipientSearch={setRecipientSearch}
        addRecipient={addRecipient}
        removeRecipient={removeRecipient}
        handleEmailInput={handleEmailInput}
        selectedClasses={selectedClasses}
        setSelectedClasses={setSelectedClasses}
        isGeneralMessage={isGeneralMessage}
        setIsGeneralMessage={setIsGeneralMessage}
        ccRecipients={ccRecipients}
        setCcRecipients={setCcRecipients}
        setShowRecipientSelector={setShowRecipientSelector}
        showRecipientSelector={showRecipientSelector}
        filteredUsers={filteredUsers}
        fetchMessages={fetchMessages}
        setLoading={setLoading}
        themeColors={themeColors}
        handleMarkAsRead={handleMarkAsRead}
        toggleStarMessage={toggleStarMessage}
        onDeleteMessage={requestDeleteMessage}
        onDeleteConversation={(c) => requestDeleteConversations([c])}
        handleRestoreMessage={handleRestoreMessage}
        handleEmptyTrash={handleEmptyTrash}
        onMessageSent={onMessageSent}
        markLiveArrivalsRead={markLiveArrivalsRead}
      />
      {deleteDialog}
      </>
    );
  }
  return (
    <div
      className={`flex h-full overflow-hidden ${isDark ? "bg-gray-900" : "bg-white"}`}
    >
      {/* Sidebar — fixed width, never shrinks */}
      <div className="flex-shrink-0">
        <Sidebar
          isDark={isDark}
          themeColors={themeColors}
          setShowCompose={setShowCompose}
          filterType={filterType}
          setFilterType={setFilterType}
          messageCounts={messageCounts}
          currentUser={currentUser}
          handleEmptyTrash={handleEmptyTrash}
        />
      </div>

      {/* Message list — takes remaining space, never overflows */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <MessageList
          isDark={isDark}
          messages={conversations}
          selectedMessage={selectedMessage}
          setSelectedMessage={setSelectedMessage}
          selectedMessages={selectedMessages}
          setSelectedMessages={setSelectedMessages}
          toggleMessageSelection={toggleMessageSelection}
          toggleStarMessage={toggleStarMessage}
          handleMarkAsRead={handleMarkAsRead}
          handleMarkConversationRead={handleMarkConversationRead}
          markReadLocally={markReadLocally}
          handleDeleteMessage={handleDeleteMessage}
          handleBulkDelete={handleBulkDelete}
          handleEmptyTrash={handleEmptyTrash}
          handleRestoreMessage={handleRestoreMessage}
          filterType={filterType}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          error={error}
          setError={setError}
          getUserInitials={getUserInitials}
          getUserDisplay={getUserDisplay}
          formatDate={formatDate}
          currentUser={currentUser}
        />
      </div>

      {/* Detail panel — fixed width, slides in without pushing the list */}
      {selectedMessage && (
        <div
          className="flex-shrink-0 w-96 border-l overflow-hidden"
          style={{
            borderColor: isDark ? "#374151" : "#e5e7eb",
          }}
        >
          <MessageDetailPanel
            isDark={isDark}
            selectedMessage={selectedMessage}
            setSelectedMessage={setSelectedMessage}
            formatDate={formatDate}
            getUserInitials={getUserInitials}
            getUserDisplay={getUserDisplay}
            currentUser={currentUser}
            onMessageSent={onMessageSent}
            handleMarkAsRead={handleMarkAsRead}
            onDeleteMessage={
              filterType === "trash" ? undefined : requestDeleteMessage
            }
            onDeleteConversation={
              filterType === "trash"
                ? undefined
                : (c) => requestDeleteConversations([c])
            }
          />
        </div>
      )}
      {showCompose && (
        <ComposeModal
          isDark={isDark}
          themeColors={themeColors}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          loading={loading}
          recipientSearch={recipientSearch}
          setRecipientSearch={setRecipientSearch}
          addRecipient={addRecipient}
          removeRecipient={removeRecipient}
          handleEmailInput={handleEmailInput}
          setShowCompose={setShowCompose}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          isGeneralMessage={isGeneralMessage}
          setIsGeneralMessage={setIsGeneralMessage}
          currentUser={currentUser}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          setShowRecipientSelector={setShowRecipientSelector}
          onMessageSent={onMessageSent}
          setError={setError}
          setLoading={setLoading}
          fetchMessages={fetchMessages}
        />
      )}

      {showRecipientSelector && (
        <RecipientSelectorModal
          isDark={isDark}
          filteredUsers={filteredUsers}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          setShowRecipientSelector={setShowRecipientSelector}
          getUserInitials={getUserInitials}
          addRecipient={addRecipient}
        />
      )}
      {deleteDialog}
    </div>
  );
};
export default MessagingInterface;
