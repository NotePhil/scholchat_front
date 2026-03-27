import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Send,
  Paperclip,
  ChevronRight,
  Plus,
  MessageSquare,
  Inbox,
  SendHorizontal,
  Mail,
  Star,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";

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
      getUserDisplay(msg.expediteur)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedThread && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedThread]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;

    setSendingReply(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      // Determine recipient objects for reply
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
        setReplyText("");
        await fetchMessages();
      } else {
        console.error("Reply failed with status:", response.status);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const filterTabs = [
    { id: "all", label: "Inbox", icon: Inbox, count: messageCounts?.all },
    {
      id: "sent",
      label: "Envoyés",
      icon: SendHorizontal,
      count: messageCounts?.sent,
    },
    {
      id: "unread",
      label: "Non lus",
      icon: Mail,
      count: messageCounts?.unread,
    },
    { id: "trash", label: "Corbeille", icon: Trash2, count: messageCounts?.trash },
  ];

  // Thread detail view
  if (selectedThread) {
    return (
      <div className="fixed inset-0 z-[1002] bg-white dark:bg-slate-950 flex flex-col">
        {/* Chat Header */}
        <header className="px-4 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedThread(null)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
              {getUserInitials(selectedThread.expediteur)}
            </div>
            <div>
              <h3 className="text-sm font-black dark:text-white leading-tight">
                {getUserDisplay(selectedThread.expediteur)}
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

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedThread.thread?.map((msg, idx) => {
            const isMe = msg.expediteur.id === currentUser?.id;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10"
                      : "bg-gray-100 dark:bg-slate-800 dark:text-white rounded-tl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.contenu}</p>
                  <p
                    className={`text-[10px] mt-1 opacity-60 text-right ${
                      isMe ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {formatDate(msg.dateCreation)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <footer className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5 pb-28">
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
              {sendingReply ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Main list view
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 pb-32">
      {/* List Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-black dark:text-white">Messages</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm"
          >
            <RefreshCw
              size={18}
              className={`text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 py-3 pl-12 pr-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 outline-none focus:border-blue-500 transition-all dark:text-white text-sm"
          />
        </div>

        {/* Filter Tabs */}
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
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
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

      {/* Loading State */}
      {loading && messages.length === 0 && (
        <div className="py-20 text-center">
          <Loader2
            size={32}
            className="mx-auto text-blue-500 animate-spin mb-4"
          />
          <p className="text-sm text-gray-500">Chargement des messages...</p>
        </div>
      )}

      {/* Conversations List */}
      {!loading || messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {filteredMessages.map((msg, idx) => (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              key={msg.id || idx}
              onClick={() => setSelectedThread(msg)}
              className="w-full flex items-center space-x-4 p-4 rounded-[28px] bg-white dark:bg-slate-800 shadow-sm border border-transparent hover:border-blue-500/20 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-base group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                  {getUserInitials(msg.expediteur)}
                </div>
                {!msg.read && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4
                    className={`text-sm truncate pr-2 ${
                      !msg.read
                        ? "font-black dark:text-white"
                        : "font-semibold text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {getUserDisplay(msg.expediteur)}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                    {formatDate(msg.dateCreation)}
                  </span>
                </div>
                <h5 className="text-[11px] font-bold text-blue-600 truncate">
                  {msg.objet}
                </h5>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {msg.contenu}
                </p>
              </div>

              {msg.isConversation && (
                <div className="flex items-center space-x-1 text-gray-300">
                  <span className="text-[10px] font-bold text-gray-400">
                    {msg.thread?.length}
                  </span>
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
              <h4 className="font-bold dark:text-white mb-1">
                Aucun message
              </h4>
              <p className="text-xs text-gray-500">
                {searchTerm
                  ? "Aucun résultat pour cette recherche"
                  : "Vos conversations apparaîtront ici"}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Floating Compose Button */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 z-[30] active:scale-95 transition-transform"
      >
        <Plus size={32} />
      </button>

      {/* Compose Modal */}
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

      {/* Recipient Selector Modal */}
      {showRecipientSelector && (
        <RecipientSelectorModal
          isDark={isDark}
          filteredUsers={filteredUsers?.filter(
            (user) => user.role === "TEACHER"
          )}
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

export default MobileMessagingInterface;
