import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  Inbox,
  Edit,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle,
  Circle,
  Reply,
  Forward,
  Trash2,
  Archive,
  Star,
  StarOff,
  RefreshCw,
  X,
  Mail,
  Users,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { messageService } from "../../../../services/MessageService";
import axios from "axios";

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
  currentUser = {
    id: localStorage.getItem("userId"),
    nom: localStorage.getItem("username"),
    email: localStorage.getItem("userEmail"),
    role: localStorage.getItem("userRole"),
    telephone: "",
    adresse: "",
    admin: localStorage.getItem("userRole") === "admin",
    creationDate: new Date().toISOString(),
  },
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [recipientSearch, setRecipientSearch] = useState("");
  // Get current theme colors
  const themeColors = colorSchemes[currentTheme] || colorSchemes.blue;

  // Compose message state
  const [newMessage, setNewMessage] = useState({
    destinataires: [],
    contenu: "",
    objet: "",
    expediteur: currentUser,
  });

  // Email validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Load messages from API
  const loadMessages = useCallback(
    async (page = 1, append = false) => {
      try {
        setLoading(!append);
        let response;

        switch (filterType) {
          case "sent":
            response = await messageService.getMessagesBySender(
              currentUser.id,
              page,
              pagination.limit
            );
            break;
          case "unread":
            response = await messageService.getMessagesByState(
              "non lu",
              page,
              pagination.limit
            );
            break;
          case "starred":
            response = await messageService.getAllMessages(
              page,
              pagination.limit
            );
            break;
          default:
            if (searchTerm) {
              response = await messageService.searchMessages(
                searchTerm,
                page,
                pagination.limit
              );
            } else {
              response = await messageService.getAllMessages(
                page,
                pagination.limit
              );
            }
        }

        // Process messages to ensure proper format
        const processedMessages = Array.isArray(response)
          ? response
          : response?.data || response?.content || [];

        setMessages((prev) =>
          append ? [...prev, ...processedMessages] : processedMessages
        );
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load messages");
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [filterType, searchTerm, currentUser.id, pagination.limit]
  );

  // Load all users from API
  const loadAllUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8486/scholchat/users");
      const users = response.data.map((user) => ({
        ...user,
        role:
          user.type === "professeur"
            ? "TEACHER"
            : user.type === "eleve"
            ? "STUDENT"
            : user.type === "parent"
            ? "PARENT"
            : user.type === "repetiteur"
            ? "EXTERNAL"
            : user.type === "admin"
            ? "ADMIN"
            : "USER",
      }));
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    }
  };

  // Filter users based on search input
  useEffect(() => {
    if (recipientSearch.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      const searchTerm = recipientSearch.toLowerCase();
      const filtered = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm) ||
          user.nom.toLowerCase().includes(searchTerm) ||
          (user.prenom && user.prenom.toLowerCase().includes(searchTerm))
      );
      setFilteredUsers(filtered);
    }
  }, [recipientSearch, allUsers]);

  // Initial load
  useEffect(() => {
    loadMessages();
    loadAllUsers();
  }, [loadMessages]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages(1, false);
    setRefreshing(false);
  };

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        loadMessages(1, false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadMessages]);

  // Handle filter change
  useEffect(() => {
    loadMessages(1, false);
  }, [filterType, loadMessages]);

  // Format date like Gmail
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

  // Get user initials for avatar
  const getUserInitials = (user) => {
    if (!user?.nom) return "?";
    return user.nom
      .split(" ")
      .map((name) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Get user display (email or name)
  const getUserDisplay = (user) => {
    return user?.email || user?.nom || "Unknown User";
  };

  // Filter messages
  const filteredMessages = messages.filter((message) => {
    if (filterType === "starred") {
      return message.starred;
    }
    return true;
  });

  // Handle message selection
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
      setLoading(true);

      const messageData = {
        contenu: newMessage.contenu,
        objet: newMessage.objet,
        expediteur: {
          type: messageService.mapRoleToBackendType(currentUser.role || "USER"),
          id: currentUser.id,
          nom: currentUser.nom,
          prenom: currentUser.prenom || "",
          email: currentUser.email,
          resetPasswordToken: null,
          telephone: currentUser.telephone || "",
          adresse: currentUser.adresse || "",
          activationToken: null,
          etat: "ACTIVE",
          creationDate: currentUser.creationDate || new Date().toISOString(),
          admin: currentUser.admin || false,
        },
        destinataires: newMessage.destinataires.map((dest) => ({
          type: messageService.mapRoleToBackendType(dest.role || "USER"),
          id: dest.id,
          nom: dest.nom,
          prenom: dest.prenom || "",
          email: dest.email,
          resetPasswordToken: null,
          telephone: dest.telephone || "",
          adresse: dest.adresse || "",
          activationToken: null,
          etat: "ACTIVE",
          creationDate: dest.creationDate || new Date().toISOString(),
          admin: dest.admin || false,
        })),
        etat: "envoyé",
      };

      await messageService.createMessage(messageData);

      setNewMessage({
        destinataires: [],
        contenu: "",
        objet: "",
        expediteur: currentUser,
      });
      setShowCompose(false);
      await loadMessages(1, false);
      setError(null);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du message");
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle email input for recipients
  const handleEmailInput = (email) => {
    if (validateEmail(email)) {
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

  // Handle mark as read/unread
  const handleMarkAsRead = async (messageId, isRead) => {
    try {
      if (isRead) {
        await messageService.markAsUnread(messageId);
      } else {
        await messageService.markAsRead(messageId);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, read: !isRead, etat: !isRead ? "lu" : "non lu" }
            : msg
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update message status");
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (err) {
      setError(err.message || "Failed to delete message");
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      await messageService.deleteMultipleMessages(messageIds);
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.has(msg.id))
      );
      setSelectedMessages(new Set());
    } catch (err) {
      setError(err.message || "Failed to delete messages");
    }
  };

  // Toggle star status
  const toggleStarMessage = async (messageId, isStarred) => {
    try {
      if (isStarred) {
        await messageService.unstarMessage(messageId);
      } else {
        await messageService.starMessage(messageId);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, starred: !isStarred } : msg
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update star status");
      console.error("Star toggle error:", err);
    }
  };

  // Add recipient to message
  const addRecipient = (user) => {
    if (!newMessage.destinataires.some((dest) => dest.id === user.id)) {
      setNewMessage((prev) => ({
        ...prev,
        destinataires: [...prev.destinataires, user],
      }));
      setRecipientSearch("");
    }
  };

  // Remove recipient from message
  const removeRecipient = (index) => {
    setNewMessage((prev) => ({
      ...prev,
      destinataires: prev.destinataires.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
      {/* Sidebar - Gmail style */}
      <div
        className={`w-64 border-r ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="p-4">
          <button
            className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            style={{ backgroundColor: themeColors.primary, color: "white" }}
            onClick={() => setShowCompose(true)}
          >
            <Edit size={20} />
            Nouveau message
          </button>
        </div>

        <div className="px-2">
          {[
            {
              key: "all",
              label: "Boîte de réception",
              icon: Inbox,
              count: messages.length,
            },
            {
              key: "starred",
              label: "Messages suivis",
              icon: Star,
              count: messages.filter((m) => m.starred).length,
            },
            {
              key: "sent",
              label: "Envoyés",
              icon: Send,
              count: messages.filter((m) => m.expediteur?.id === currentUser.id)
                .length,
            },
            {
              key: "unread",
              label: "Non lus",
              icon: Circle,
              count: messages.filter((m) => !m.read).length,
            },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm mb-1 transition-colors ${
                filterType === key
                  ? isDark
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-50 text-blue-700 border-r-3 border-blue-600"
                  : isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFilterType(key)}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
              </div>
              {count > 0 && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    filterType === key
                      ? "bg-blue-600 text-white"
                      : isDark
                      ? "bg-gray-600 text-gray-300"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar - Gmail style */}
        <div
          className={`px-6 py-3 border-b flex items-center gap-4 ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedMessages.size > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  className={`p-2 rounded-full ${
                    isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedMessages(new Set())}
                >
                  <X size={16} />
                </button>
                <span className="text-sm text-gray-600">
                  {selectedMessages.size} sélectionné(s)
                </span>
                <button
                  className={`p-2 rounded-full text-red-600 ${
                    isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 max-w-2xl">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher dans les messages"
              className={`w-full pl-12 pr-4 py-3 rounded-full border-2 focus:outline-none focus:border-blue-500 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className={`p-2 rounded-full ${
              isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Messages List - Gmail style */}
        <div
          className={`flex-1 overflow-y-auto ${
            isDark ? "bg-gray-900" : "bg-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Mail
                size={64}
                className={`mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
              />
              <h3
                className={`text-xl font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {searchTerm ? "Aucun résultat trouvé" : "Aucun message"}
              </h3>
              <p className={`${isDark ? "text-gray-500" : "text-gray-500"}`}>
                {searchTerm
                  ? "Essayez avec d'autres mots-clés"
                  : "Votre boîte de réception est vide"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-center px-6 py-4 hover:shadow-md transition-all cursor-pointer group ${
                    selectedMessage?.id === message.id
                      ? isDark
                        ? "bg-blue-900"
                        : "bg-blue-50"
                      : isDark
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-50"
                  } ${!message.read ? "border-l-4 border-blue-500" : ""}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    className="mr-4 rounded"
                    checked={selectedMessages.has(message.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleMessageSelection(message.id);
                    }}
                  />

                  {/* Star */}
                  <button
                    className={`mr-4 p-1 rounded-full ${
                      isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarMessage(message.id, message.starred);
                    }}
                  >
                    {message.starred ? (
                      <Star
                        size={16}
                        className="text-yellow-500 fill-current"
                      />
                    ) : (
                      <StarOff
                        size={16}
                        className={isDark ? "text-gray-400" : "text-gray-400"}
                      />
                    )}
                  </button>

                  {/* Sender Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                      isDark
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {getUserInitials(message.expediteur)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium truncate ${
                            !message.read ? "font-bold" : ""
                          } ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {getUserDisplay(message.expediteur)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isDark
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {message.expediteur?.role}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatDate(message.dateCreation)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium text-sm ${
                          !message.read ? "font-bold" : ""
                        } ${isDark ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {message.objet || "Sans objet"}
                      </span>
                    </div>

                    <p
                      className={`text-sm truncate ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {message.contenu}
                    </p>

                    {/* Recipients */}
                    {message.destinataires &&
                      message.destinataires.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users
                            size={12}
                            className={
                              isDark ? "text-gray-500" : "text-gray-400"
                            }
                          />
                          <span
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {message.destinataires
                              .map((dest) => getUserDisplay(dest))
                              .join(", ")}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className={`p-2 rounded-full ${
                        isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(message.id, message.read);
                      }}
                    >
                      {message.read ? (
                        <Circle size={14} />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                    </button>
                    <button
                      className={`p-2 rounded-full ${
                        isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(message.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Panel */}
      {selectedMessage && (
        <div
          className={`w-96 border-l ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <div
            className={`p-6 border-b ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {selectedMessage.objet || "Sans objet"}
              </h2>
              <button
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedMessage(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
                  isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {getUserInitials(selectedMessage.expediteur)}
              </div>
              <div>
                <div
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {getUserDisplay(selectedMessage.expediteur)}
                </div>
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {formatDate(selectedMessage.dateCreation)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Reply size={16} />
                Répondre
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Forward size={16} />
                Transférer
              </button>
            </div>
          </div>

          <div
            className={`p-6 flex-1 overflow-y-auto ${
              isDark ? "text-gray-300" : "text-gray-800"
            }`}
          >
            <div className="whitespace-pre-wrap">{selectedMessage.contenu}</div>
          </div>
        </div>
      )}

      {/* Compose Modal - Gmail style */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Nouveau message
              </h3>
              <button
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
                onClick={() => setShowCompose(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Recipients */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  À
                </label>
                <div
                  className={`border rounded-lg p-3 ${
                    isDark
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newMessage.destinataires.map((dest, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {getUserDisplay(dest)}
                        <button onClick={() => removeRecipient(index)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher ou entrer une adresse email"
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        // Show suggestions after 2 characters
                        if (e.target.value.length >= 2) {
                          const searchTerm = e.target.value.toLowerCase();
                          const results = allUsers.filter(
                            (user) =>
                              user.email.toLowerCase().includes(searchTerm) ||
                              user.nom.toLowerCase().includes(searchTerm)
                          );
                          setFilteredUsers(results);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          recipientSearch.includes("@")
                        ) {
                          // Handle email entry
                          handleEmailInput(recipientSearch);
                          setRecipientSearch("");
                        }
                      }}
                    />

                    {recipientSearch && (
                      <div
                        className={`absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-10 ${
                          isDark ? "bg-gray-700" : "bg-white"
                        } shadow-lg rounded-md border ${
                          isDark ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className={`p-2 hover:bg-blue-100 cursor-pointer ${
                                isDark ? "hover:bg-gray-600" : ""
                              }`}
                              onClick={() => addRecipient(user)}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isDark
                                      ? "bg-gray-600 text-gray-300"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {getUserInitials(user)}
                                </div>
                                <div>
                                  <div className="text-sm">
                                    {user.nom} {user.prenom}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            Aucun utilisateur trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Objet
                </label>
                <input
                  type="text"
                  placeholder="Saisissez l'objet du message"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  value={newMessage.objet}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      objet: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Message Content */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Message
                </label>
                <textarea
                  placeholder="Tapez votre message ici..."
                  rows={8}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  value={newMessage.contenu}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      contenu: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Footer with Actions */}
            <div
              className={`p-6 border-t flex items-center justify-between ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {newMessage.destinataires.length > 0 && (
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {newMessage.destinataires.length} destinataire(s)
                    sélectionné(s)
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  className={`px-6 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setShowCompose(false)}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  className={`px-6 py-2 rounded-lg text-white transition-all flex items-center gap-2 ${
                    loading ||
                    !newMessage.contenu.trim() ||
                    newMessage.destinataires.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "hover:shadow-lg"
                  }`}
                  style={{
                    backgroundColor:
                      loading ||
                      !newMessage.contenu.trim() ||
                      newMessage.destinataires.length === 0
                        ? undefined
                        : themeColors.primary,
                  }}
                  onClick={handleSendMessage}
                  disabled={
                    loading ||
                    !newMessage.contenu.trim() ||
                    newMessage.destinataires.length === 0
                  }
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingInterface;
