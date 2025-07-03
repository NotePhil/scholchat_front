import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageDetailPanel from "./MessageDetailPanel";
import ComposeModal from "./ComposeModal";
import RecipientSelectorModal from "./RecipientSelectorModal";
import { demoUsers, demoClasses, demoMessages } from "./demoData";

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
  currentUser = demoUsers[0] // Default to first user (teacher)
}) => {
  const [messages, setMessages] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState(demoUsers);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Load user's classes based on their role
  useEffect(() => {
    if (currentUser.role === "TEACHER") {
      // Teacher can publish to their classes
      setClassesList(demoClasses.filter(c => currentUser.classes.includes(c.id)));
    } else {
      // Other users can access their classes
      setClassesList(demoClasses.filter(c => currentUser.accessClasses.includes(c.id)));
    }
  }, [currentUser]);

  const loadMessages = useCallback(() => {
    setLoading(true);
    try {
      // Filter messages based on current user
      let userMessages = demoMessages.filter(msg => {
        // Sent messages
        if (msg.expediteur.id === currentUser.id) return true;

        // Received messages
        if (msg.destinataires.some(dest => dest.id === currentUser.id)) return true;

        // General messages to user's classes
        if (msg.isGeneral && msg.classes.some(c => currentUser.accessClasses.includes(c))) {
          return true;
        }

        return false;
      });

      // Apply filters
      if (filterType === "sent") {
        userMessages = userMessages.filter(msg => msg.expediteur.id === currentUser.id);
      } else if (filterType === "unread") {
        userMessages = userMessages.filter(msg => !msg.read);
      } else if (filterType === "starred") {
        userMessages = userMessages.filter(msg => msg.starred);
      }

      // Apply search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        userMessages = userMessages.filter(msg =>
          msg.objet.toLowerCase().includes(term) ||
          msg.contenu.toLowerCase().includes(term) ||
          msg.expediteur.nom.toLowerCase().includes(term)
        );
      }

      setMessages(userMessages);
      setError(null);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [filterType, searchTerm, currentUser]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
    setRefreshing(false);
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
    return user.nom
      .split(" ")
      .map((name) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getUserDisplay = (user) => {
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

  const handleSendMessage = () => {
    if (!newMessage.contenu.trim() || (selectedClasses.length === 0 && newMessage.destinataires.length === 0)) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      // Determine recipients based on selected classes and general message setting
      let finalRecipients = [...newMessage.destinataires];
      let finalCcRecipients = [...ccRecipients];

      if (isGeneralMessage && selectedClasses.length > 0) {
        selectedClasses.forEach(classeId => {
          const classe = demoClasses.find(c => c.id === classeId);
          if (!classe) return;

          if (currentUser.role === "TEACHER") {
            // Send to all students/parents in class
            const members = demoUsers.filter(u => classe.eleves.includes(u.id));
            finalRecipients = [...finalRecipients, ...members];

            // Add other teachers as CC
            const otherTeachers = demoUsers.filter(u =>
              u.role === "TEACHER" &&
              u.id !== currentUser.id &&
              classe.professeurs.includes(u.id)
            );
            finalCcRecipients = [...finalCcRecipients, ...otherTeachers];
          } else {
            // Send to all teachers in class
            const teachers = demoUsers.filter(u => classe.professeurs.includes(u.id));
            finalRecipients = [...finalRecipients, ...teachers];
          }
        });
      }

      // Create new message
      const newMsg = {
        id: Math.max(...demoMessages.map(m => m.id)) + 1,
        objet: newMessage.objet,
        contenu: newMessage.contenu,
        dateCreation: new Date().toISOString(),
        expediteur: currentUser,
        destinataires: finalRecipients,
        read: false,
        starred: false,
        classes: selectedClasses,
        isGeneral: isGeneralMessage,
        cc: finalCcRecipients
      };

      // Update state
      setMessages([newMsg, ...messages]);

      // Reset form
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
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (messageId, isRead) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: !isRead } : msg
      )
    );
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  const handleBulkDelete = () => {
    const messageIds = Array.from(selectedMessages);
    setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
    setSelectedMessages(new Set());
  };

  const toggleStarMessage = (messageId, isStarred) => {
    setMessages(prev =>
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

  return (
    <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <Sidebar
        isDark={isDark}
        themeColors={themeColors}
        setShowCompose={setShowCompose}
        filterType={filterType}
        setFilterType={setFilterType}
        messages={messages}
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
      />
      {selectedMessage && (
        <MessageDetailPanel
          isDark={isDark}
          selectedMessage={selectedMessage}
          setSelectedMessage={setSelectedMessage}
          formatDate={formatDate}
          getUserInitials={getUserInitials}
          getUserDisplay={getUserDisplay}
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
