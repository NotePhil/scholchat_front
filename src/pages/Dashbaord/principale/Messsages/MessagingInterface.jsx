import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageDetailPanel from "./MessageDetailPanel";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";
import { useAuth } from "../../../../context/AuthContext";
import { useSelector } from "react-redux";
import { messageService } from "../../../../services/MessageService";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Send,
  ChevronRight,
  Plus,
  MessageSquare,
  Inbox,
  SendHorizontal,
  Star,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  handleDeleteMessage,
  handleMarkAsRead,
  toggleStarMessage,
}) => {
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef(null);

  const filteredMessages = messages.filter(
    (msg) =>
      msg.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserDisplay(msg.partner || msg.expediteur).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedThread && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedThread]);

  // Keep the open thread in sync with the inbox data (new incoming messages,
  // the poll above, etc). MERGE rather than replace — a refetch can briefly
  // lag behind a message we just sent optimistically, and overwriting wholesale
  // would make that message flash and disappear until the next successful fetch.
  useEffect(() => {
    if (!selectedThread) return;
    const key = selectedThread.partner?.id || selectedThread.expediteur?.id;
    const updated = messages.find(
      (m) => (m.partner?.id || m.expediteur?.id) === key
    );
    if (!updated || updated === selectedThread) return;

    setSelectedThread((prev) => {
      if (!prev) return prev;
      const isSameMessage = (a, b) =>
        a.id === b.id ||
        (String(a.id).startsWith("temp-") &&
          a.contenu === b.contenu &&
          a.expediteur?.id === b.expediteur?.id);

      const merged = [...(prev.thread || [])];
      (updated.thread || []).forEach((freshMsg) => {
        const idx = merged.findIndex((m) => isSameMessage(m, freshMsg));
        if (idx === -1) {
          merged.push(freshMsg);
        } else if (String(merged[idx].id).startsWith("temp-")) {
          merged[idx] = freshMsg; // replace the optimistic placeholder with the real, persisted message
        }
      });
      merged.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));

      return { ...updated, thread: merged };
    });
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setSendingReply(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const recipientObjects =
        selectedThread.expediteur.id === userId
          ? selectedThread.destinataires.map((d) => ({
              type: "utilisateur",
              id: d.id,
              nom: d.nom || "",
              prenom: d.prenom || "",
              email: d.email || "",
              telephone: d.telephone || "",
              adresse: d.adresse || "",
              etat: "ACTIVE",
              admin: d.admin || false,
            }))
          : [{
              type: "utilisateur",
              id: selectedThread.expediteur.id,
              nom: selectedThread.expediteur.nom || "",
              prenom: selectedThread.expediteur.prenom || "",
              email: selectedThread.expediteur.email || "",
              telephone: selectedThread.expediteur.telephone || "",
              adresse: selectedThread.expediteur.adresse || "",
              etat: "ACTIVE",
              admin: selectedThread.expediteur.admin || false,
            }];
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            contenu: replyText,
            objet: `Re: ${selectedThread.objet?.replace(/^Re:\s*/i, "")}`,
            dateCreation: new Date().toISOString(),
            etat: "envoyé",
            expediteur: {
              type: "utilisateur",
              id: userId,
              nom: currentUser?.nom || "",
              prenom: currentUser?.prenom || "",
              email: currentUser?.email || "",
              telephone: currentUser?.telephone || "",
              adresse: currentUser?.adresse || "",
              etat: "ACTIVE",
              admin: currentUser?.admin || false,
            },
            destinataires: recipientObjects,
          }),
        }
      );
      if (response.ok) {
        // Show the sent message immediately instead of waiting on the refetch.
        const optimisticMsg = {
          id: `temp-${Date.now()}`,
          contenu: replyText,
          dateCreation: new Date().toISOString(),
          expediteur: { id: userId, ...currentUser },
          destinataires: recipientObjects,
          read: true,
        };
        setSelectedThread((prev) =>
          prev ? { ...prev, thread: [...(prev.thread || []), optimisticMsg] } : prev
        );
        setReplyText("");
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const filterTabs = [
    { id: "all", label: "Inbox", icon: Inbox, count: messageCounts?.unreadReceived },
    { id: "sent", label: "Envoyés", icon: SendHorizontal, count: messageCounts?.sent },
    { id: "trash", label: "Corbeille", icon: Trash2, count: messageCounts?.trash },
  ];

  if (selectedThread) {
    return (
      <div className="fixed inset-0 z-[1002] bg-white dark:bg-slate-950 flex flex-col">
        <header className="px-4 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSelectedThread(null)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
              {getUserInitials(selectedThread.partner || selectedThread.expediteur)}
            </div>
            <div>
              <h3 className="text-sm font-black dark:text-white leading-tight">
                {getUserDisplay(selectedThread.partner || selectedThread.expediteur)}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold truncate max-w-[180px]">
                {selectedThread.objet}
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400">
            <MoreVertical size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-4">
          {selectedThread.thread?.map((msg, idx) => {
            const isMe = msg.expediteur.id === currentUser?.id;
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10"
                    : "bg-gray-100 dark:bg-slate-800 dark:text-white rounded-tl-none"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.contenu}</p>
                  <p className={`text-[10px] mt-1 opacity-60 text-right ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                    {formatDate(msg.dateCreation)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <footer
          className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 16px))' }}
        >
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-[24px]">
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
              disabled={!replyText.trim() || sendingReply}
              className={`p-3 rounded-full shadow-lg transition-all ${
                replyText.trim()
                  ? "bg-blue-600 text-white shadow-blue-500/30"
                  : "bg-gray-200 dark:bg-slate-700 text-gray-400"
              }`}
            >
              {sendingReply ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
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
          <button onClick={handleRefresh} disabled={loading} className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
            <RefreshCw size={18} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-3 pl-12 pr-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white text-sm"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                  }`}>
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
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => { setError(null); handleRefresh(); }} className="text-xs font-bold text-red-600 dark:text-red-400 underline">
            Réessayer
          </button>
        </div>
      )}

      {loading && messages.length === 0 && (
        <div className="py-20 text-center">
          <Loader2 size={32} className="mx-auto text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Chargement des messages...</p>
        </div>
      )}

      {!loading || messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {filteredMessages.map((msg, idx) => (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              key={msg.id || idx}
              onClick={() => {
                setSelectedThread(msg);
                const threadIds = msg.thread
                  ? msg.thread.filter(m => !m.read && m.expediteur?.id !== currentUser?.id).map(m => m.id)
                  : (!msg.read && msg.expediteur?.id !== currentUser?.id ? [msg.id] : []);
                threadIds.forEach(id => handleMarkAsRead(id, true));
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
                  <h4 className={`text-sm truncate pr-2 ${!msg.read ? "font-black dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300"}`}>
                    {getUserDisplay(msg.partner || msg.expediteur)}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                    {formatDate(msg.dateCreation)}
                  </span>
                </div>
                <h5 className="text-[11px] font-bold text-blue-600 truncate">{msg.objet}</h5>
                <p className="text-xs text-gray-500 truncate mt-0.5">{msg.contenu}</p>
              </div>
              {msg.isConversation && (
                <div className="flex items-center space-x-1 text-gray-300">
                  <span className="text-[10px] font-bold text-gray-400">{msg.thread?.length}</span>
                  <ChevronRight size={14} />
                </div>
              )}
            </motion.button>
          ))}

          {filteredMessages.length === 0 && !loading && (
            <div className="py-20 text-center">
              <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
                <MessageSquare size={40} className="text-gray-400" />
              </div>
              <h4 className="font-bold dark:text-white mb-1">Aucun message</h4>
              <p className="text-xs text-gray-500">
                {searchTerm ? "Aucun résultat pour cette recherche" : "Vos conversations apparaîtront ici"}
              </p>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
      >
        <Plus size={32} />
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
          onMessageSent={fetchMessages}
          setError={setError}
          setLoading={setLoading}
          fetchMessages={fetchMessages}
        />
      )}

      {showRecipientSelector && (
        <RecipientSelectorModal
          isDark={isDark}
          filteredUsers={filteredUsers?.filter((user) => user.role === "TEACHER")}
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
    blue: { primary: "#1a73e8", light: "#e8f0fe", dark: "#1557b0" },
    green: { primary: "#34a853", light: "#e6f4ea", dark: "#137333" },
    red: { primary: "#ea4335", light: "#fce8e6", dark: "#c5221f" },
  },
  onClose,
  selectedConversation,
  userRole = "ADMIN",
}) => {
  const { user: currentUser } = useAuth(); // Use the useAuth hook to retrieve the current user
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
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
      const messageBody = contenu.replace(subjectMatch[0], '').trim();
      return { subject, messageBody };
    }
    return { subject: "Sans objet", messageBody: contenu };
  };

  const fetchUnreadCount = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      const count = await messageService.compterNonLus(userId);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (e) {
      // silently ignore — fallback to client-side count
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    const parentId = localStorage.getItem('userId');
    const selectedRole = (localStorage.getItem('userRole') || '').toUpperCase();
    const isParentRole = selectedRole.includes('PARENT');
    // For parents: use selected child's ID so they see child's messages, not professor messages
    const userId = isParentRole
      ? (localStorage.getItem('selectedChildId') || parentId)
      : parentId;
    if (!userId) return;

    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const transformMessage = (msg) => {
        return {
          id: msg.id,
          objet: msg.objet || "Sans objet",
          contenu: msg.contenu,
          dateCreation: msg.dateCreation,
          dateModification: msg.dateModification,
          etat: msg.etat,
          expediteur: {
            id: msg.expediteur.id,
            nom: msg.expediteur.nom,
            prenom: msg.expediteur.prenom,
            email: msg.expediteur.email,
            telephone: msg.expediteur.telephone,
            adresse: msg.expediteur.adresse,
            role: msg.expediteur.admin ? "ADMIN" : "USER",
            type: msg.expediteur.type
          },
          destinataires: msg.destinataires.map(dest => ({
            id: dest.id,
            nom: dest.nom,
            prenom: dest.prenom,
            email: dest.email,
            telephone: dest.telephone,
            adresse: dest.adresse,
            role: dest.admin ? "ADMIN" : "USER",
            type: dest.type
          })),
          // /received returns lu & favori directly; /sent messages are always read by sender
          read: msg.lu !== undefined ? msg.lu : true,
          starred: msg.favori || false,
          classes: [],
          isGeneral: false
        };
      };
      
      // Fetch sent, received, and trash messages
      const [sentResponse, receivedResponse, trashResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/sent`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/received`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/utilisateur/${userId}/trash`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      if (!sentResponse.ok || !receivedResponse.ok) {
        throw new Error('Failed to fetch messages');
      }

      const [sentData, receivedData] = await Promise.all([
        sentResponse.json(),
        receivedResponse.json()
      ]);

      // Handle trash messages separately
      let trashData = [];
      if (trashResponse.ok) {
        trashData = await trashResponse.json();
        setTrashMessages(trashData.map(transformMessage));
      }

      const allMessages = [
        ...sentData.map(transformMessage),
        ...receivedData.map(transformMessage)
      ];

      setAllMessages(allMessages);
      setError(null);
      fetchUnreadCount();
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Groups by conversation PARTNER (the other person), not by subject — so all
  // messages exchanged with the same person (sent + received, any subject)
  // merge into one continuous thread, WhatsApp-style.
  const groupMessagesByConversation = (messages) => {
    const userId = localStorage.getItem('userId');
    const conversations = {};
    const partners = {};

    messages.forEach(msg => {
      const isSender = msg.expediteur.id === userId;
      let key;
      let partner;
      if (isSender && msg.destinataires.length === 1) {
        partner = msg.destinataires[0];
        key = partner.id;
      } else if (!isSender) {
        partner = msg.expediteur;
        key = partner.id;
      } else {
        // Sender with several recipients (broadcast/general message) — these
        // don't have a single "other person", keep them grouped by recipient set.
        partner = msg.expediteur;
        key = `broadcast:${msg.destinataires.map(d => d.id).sort().join(',')}`;
      }
      if (!conversations[key]) conversations[key] = [];
      conversations[key].push(msg);
      partners[key] = partner;
    });

    return Object.entries(conversations).map(([key, thread]) => {
      thread.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
      const latestMessage = thread[thread.length - 1];
      return {
        ...latestMessage,
        thread,
        isConversation: thread.length > 1,
        partner: partners[key],
      };
    });
  };

  const filterMessages = useCallback(() => {
    const userId = localStorage.getItem('userId');
    let filteredMessages = [...allMessages];
    switch (filterType) {
      case "all":
        filteredMessages = filteredMessages.filter(msg =>
          msg.destinataires.some(dest => dest.id === userId)
        );
        break;
      case "sent":
        filteredMessages = filteredMessages.filter(msg =>
          msg.expediteur.id === userId
        );
        break;
      case "starred":
        filteredMessages = filteredMessages.filter(msg => msg.starred);
        break;
      case "trash":
        filteredMessages = [...trashMessages];
        break;
      default:
        break;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredMessages = filteredMessages.filter(msg =>
        msg.objet.toLowerCase().includes(term) ||
        msg.contenu.toLowerCase().includes(term) ||
        msg.expediteur.nom.toLowerCase().includes(term) ||
        msg.expediteur.prenom.toLowerCase().includes(term)
      );
    }

    const conversations = groupMessagesByConversation(filteredMessages);
    conversations.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    setMessages(conversations);
  }, [allMessages, filterType, searchTerm]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages — there's no websocket/push, so without this an
  // incoming reply only shows up after a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    filterMessages();
  }, [filterMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages().finally(() => {
      setRefreshing(false);
    });
  };

  const getMessageCounts = () => {
    const userId = localStorage.getItem('userId');

    // Deduplicate allMessages by id first
    const uniqueMessages = allMessages.filter(
      (msg, idx, self) => self.findIndex(m => m.id === msg.id) === idx
    );

    const receivedMessages = uniqueMessages.filter(msg =>
      msg.destinataires.some(dest => dest.id === userId)
    );
    const unreadReceived = receivedMessages.filter(msg => !msg.read);

    const sentMessages = uniqueMessages.filter(msg =>
      msg.expediteur.id === userId
    );
    const unreadSent = sentMessages.filter(msg => !msg.read);

    const starredMessages = uniqueMessages.filter(msg => msg.starred);

    return {
      totalReceived: receivedMessages.length,
      unreadReceived: unreadReceived.length,
      all: unreadReceived.length,       // inbox badge = unread received only
      unread: unreadReceived.length,
      sent: unreadSent.length,          // sent badge = unread by recipient only
      starred: starredMessages.length,
      trash: trashMessages.length,
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
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
    setLoading(true);
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

      await fetchMessages();
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId, newRead) => {
    const userId = localStorage.getItem('userId');
    // Optimistically update the message read state
    setAllMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, read: newRead } : msg
    ));
    messageService.setStatutLu(messageId, userId, newRead)
      .catch(e => {
        console.warn('Could not update read status:', e.message);
        // Revert on failure
        setAllMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, read: !newRead } : msg
        ));
      });
  };

  // Mark as read locally only (no API call) — used for sent messages viewed by sender
  const markReadLocally = (messageId) => {
    setAllMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setAllMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        
        // Refresh to update trash
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Erreur lors de la suppression du message');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const messageIds = Array.from(selectedMessages);
      
      await Promise.all(messageIds.map(id => 
        fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ));
      
      setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
      setAllMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
      setSelectedMessages(new Set());
      
      // Refresh to update trash
      fetchMessages();
    } catch (error) {
      console.error('Error bulk deleting messages:', error);
      setError('Erreur lors de la suppression des messages');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/trash/cleanup`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        setTrashMessages([]);
        if (filterType === 'trash') {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error emptying trash:', error);
      setError('Erreur lors du vidage de la corbeille');
    }
  };

  const handleRestoreMessage = async (messageId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/messages/${messageId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        setTrashMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (filterType === 'trash') {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
        fetchMessages();
      }
    } catch (error) {
      console.error('Error restoring message:', error);
      setError('Erreur lors de la restauration du message');
    }
  };

  const toggleStarMessage = async (messageId, isStarred) => {
    const userId = localStorage.getItem('userId');
    const newStarred = !isStarred;
    setAllMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, starred: newStarred } : msg));
    try {
      await messageService.setStatutFavori(messageId, userId, newStarred);
    } catch (e) {
      console.warn('Could not update favori status:', e.message);
      setAllMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, starred: !newStarred } : msg));
    }
  };

  const addRecipient = (user) => {
    if (!newMessage.destinataires.some(dest => dest.id === user.id)) {
      setNewMessage(prev => ({
        ...prev,
        destinataires: [...prev.destinataires, user],
      }));
      setRecipientSearch("");
    }
  };

  const removeRecipient = (index) => {
    setNewMessage(prev => ({
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
      setNewMessage(prev => ({
        ...prev,
        destinataires: [...prev.destinataires, emailUser],
      }));
      return true;
    }
    return false;
  };

  const messageCounts = getMessageCounts();

  const isMobile = useSelector((state) => state.ui.isMobile);

  if (isMobile) {
    return (
      <MobileMessagingInterface
        messages={messages}
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
        handleDeleteMessage={handleDeleteMessage}
        handleMarkAsRead={handleMarkAsRead}
        toggleStarMessage={toggleStarMessage}
      />
    );
  }

  return (
    <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
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
      <MessageList
        isDark={isDark}
        messages={messages}
        selectedMessage={selectedMessage}
        setSelectedMessage={setSelectedMessage}
        selectedMessages={selectedMessages}
        setSelectedMessages={setSelectedMessages}
        toggleMessageSelection={toggleMessageSelection}
        toggleStarMessage={toggleStarMessage}
        handleMarkAsRead={handleMarkAsRead}
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
      {selectedMessage && (
        <MessageDetailPanel
          isDark={isDark}
          selectedMessage={selectedMessage}
          setSelectedMessage={setSelectedMessage}
          formatDate={formatDate}
          getUserInitials={getUserInitials}
          getUserDisplay={getUserDisplay}
          currentUser={currentUser}
          onRefreshMessages={handleRefresh}
          handleMarkAsRead={handleMarkAsRead}
        />
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
    onMessageSent={fetchMessages}
    setError={setError}
    setLoading={setLoading}
    fetchMessages={fetchMessages}
  />
)}

      {showRecipientSelector && (
        <RecipientSelectorModal
          isDark={isDark}
          filteredUsers={filteredUsers.filter(user => user.role === "TEACHER")}
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

export default MessagingInterface;
