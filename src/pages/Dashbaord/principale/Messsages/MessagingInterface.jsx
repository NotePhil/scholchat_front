import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageDetailPanel from "./MessageDetailPanel";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";
import { useAuth } from "../../../../context/AuthContext"; // Import the useAuth hook

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
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8486/scholchat/messages/utilisateur/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedMessages = data.map(msg => {
        const { subject, messageBody } = parseMessageContent(msg.contenu);
        return {
          id: msg.id,
          objet: subject,
          contenu: messageBody,
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
      });

      setAllMessages(transformedMessages);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const filterMessages = useCallback(() => {
    let filteredMessages = [...allMessages];
    switch (filterType) {
      case "all":
        filteredMessages = filteredMessages.filter(msg =>
          msg.destinataires.some(dest => dest.id === currentUser.id)
        );
        break;
      case "sent":
        filteredMessages = filteredMessages.filter(msg =>
          msg.expediteur.id === currentUser.id
        );
        break;
      case "unread":
        filteredMessages = filteredMessages.filter(msg =>
          !msg.read && msg.destinataires.some(dest => dest.id === currentUser.id)
        );
        break;
      case "starred":
        filteredMessages = filteredMessages.filter(msg => msg.starred);
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

    filteredMessages.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    setMessages(filteredMessages);
  }, [allMessages, filterType, searchTerm, currentUser?.id]);

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
    const receivedMessages = allMessages.filter(msg =>
      msg.destinataires.some(dest => dest.id === currentUser.id)
    );
    const sentMessages = allMessages.filter(msg =>
      msg.expediteur.id === currentUser.id
    );
    const unreadMessages = allMessages.filter(msg =>
      !msg.read && msg.destinataires.some(dest => dest.id === currentUser.id)
    );
    const starredMessages = allMessages.filter(msg => msg.starred);
    return {
      all: receivedMessages.length,
      sent: sentMessages.length,
      unread: unreadMessages.length,
      starred: starredMessages.length
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
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setAllMessages(prev => prev.filter(msg => msg.id !== messageId));

    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const handleBulkDelete = async () => {
    const messageIds = Array.from(selectedMessages);
    setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    setAllMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    setSelectedMessages(new Set());
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
          handleSendMessage={handleSendMessage}
          loading={loading}
          recipientSearch={recipientSearch}
          setRecipientSearch={setRecipientSearch}
          filteredUsers={filteredUsers}
          addRecipient={addRecipient}
          removeRecipient={removeRecipient}
          handleEmailInput={handleEmailInput}
          setShowCompose={setShowCompose}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          isGeneralMessage={isGeneralMessage}
          setIsGeneralMessage={setIsGeneralMessage}
          currentUser={currentUser}
          classesList={classesList}
          ccRecipients={ccRecipients}
          setCcRecipients={setCcRecipients}
          setShowRecipientSelector={setShowRecipientSelector}
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
