import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageDetailPanel from "./MessageDetailPanel";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";
import { useAuth } from "../../../../context/AuthContext"; // Import the useAuth hook
import { useSelector } from "react-redux";
import MobileMessagingInterface from "./MobileMessagingInterface";

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

  const fetchMessages = useCallback(async () => {
    const userId = localStorage.getItem('userId');
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
          read: msg.etat === "lu",
          starred: false,
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
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const groupMessagesByConversation = (messages) => {
    const conversations = {};
    
    messages.forEach(msg => {
      const baseSubject = msg.objet?.replace(/^Re:\s*/i, '') || 'Sans objet';
      if (!conversations[baseSubject]) {
        conversations[baseSubject] = [];
      }
      conversations[baseSubject].push(msg);
    });
    
    return Object.values(conversations).map(thread => {
      thread.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
      const latestMessage = thread[thread.length - 1];
      return {
        ...latestMessage,
        thread,
        isConversation: thread.length > 1
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
      case "unread":
        filteredMessages = filteredMessages.filter(msg =>
          !msg.read && msg.destinataires.some(dest => dest.id === userId)
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
    const receivedMessages = allMessages.filter(msg =>
      msg.destinataires.some(dest => dest.id === userId)
    );
    const sentMessages = allMessages.filter(msg =>
      msg.expediteur.id === userId
    );
    const unreadMessages = allMessages.filter(msg =>
      !msg.read && msg.destinataires.some(dest => dest.id === userId)
    );
    const starredMessages = allMessages.filter(msg => msg.starred);
    return {
      all: receivedMessages.length,
      sent: sentMessages.length,
      unread: unreadMessages.length,
      starred: starredMessages.length,
      trash: trashMessages.length
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

  const handleMarkAsRead = async (messageId, isRead) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: !isRead } : msg
      )
    );

    setAllMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: !isRead } : msg
      )
    );
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
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, starred: !isStarred } : msg
      )
    );

    setAllMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, starred: !isStarred } : msg
      )
    );
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
