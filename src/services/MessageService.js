import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with common configuration
const messageApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to handle different content types and authentication
messageApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    // Let browser set the boundary for multipart/form-data
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Enhanced response interceptor to handle common errors
messageApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          window.location.href = "/login";
          break;
        case 403:
          // Handle forbidden access
          console.error("Forbidden access:", error.response.data);
          break;
        case 404:
          // Handle not found errors
          console.error("Resource not found:", error.response.config.url);
          break;
        case 405:
          // Handle method not allowed
          console.error("Method not allowed:", error.response.config.method);
          break;
        default:
          console.error("Server error:", error.response.data);
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

class MessageService {
  // ============ Enhanced Error Handler ============
  handleError(error) {
    let errorMessage = "An error occurred";

    if (error.response) {
      // Handle specific error cases
      if (error.response.status === 405) {
        errorMessage = "This operation is not allowed by the server";
      } else if (
        error.response.data?.error?.includes("Could not resolve type id")
      ) {
        errorMessage =
          "Invalid user type configuration. Please contact support.";
      } else {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Server error occurred";
      }
    } else if (error.request) {
      errorMessage = "Network error occurred. Please check your connection.";
      console.error("Network Error:", error.request);
    } else {
      errorMessage = "Error setting up request: " + error.message;
      console.error("Request Error:", error.message);
    }

    console.error("Error details:", error);
    throw new Error(errorMessage);
  }

  // ============ Helper Methods ============
  createFormDataFromObject(data) {
    const formData = new FormData();

    const appendToFormData = (key, value) => {
      if (value === null || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && !(item instanceof File)) {
            appendToFormData(`${key}[${index}]`, item);
          } else {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          appendToFormData(`${key}.${subKey}`, subValue);
        });
      } else {
        formData.append(key, value.toString());
      }
    };

    Object.entries(data).forEach(([key, value]) => {
      appendToFormData(key, value);
    });

    return formData;
  }

  // Helper method to map frontend roles to backend types
  mapRoleToBackendType(role) {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "admin";
      case "TEACHER":
        return "professeur";
      case "STUDENT":
        return "eleve";
      case "PARENT":
        return "parent";
      case "EXTERNAL":
        return "repetiteur";
      default:
        return "utilisateur";
    }
  }

  // Helper method to prepare user object for backend - updated to match Postman structure
  prepareUserForBackend(user) {
    if (!user) return null;

    // Backend expects the full user object as per the Postman example
    return {
      type: user.type || "utilisateur",
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      resetPasswordToken: user.resetPasswordToken || null,
      telephone: user.telephone,
      adresse: user.adresse,
      activationToken: user.activationToken || null,
      etat: user.etat || "ACTIVE",
      creationDate: user.creationDate || new Date().toISOString(),
      admin: user.admin || false,
    };
  }

  // Helper method to format date for backend (YYYY-MM-DD format)
  formatDateForBackend(date = new Date()) {
    return date.toISOString().split("T")[0];
  }

  // ============ Message Management ============
  /**
   * Get all messages
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages
   */
  async getAllMessages(page = 1, limit = 10) {
    try {
      const response = await messageApi.get("/messages", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a specific message by ID
   * @param {string} messageId - The ID of the message to retrieve
   * @returns {Promise<Object>} Message object
   */
  async getMessageById(messageId) {
    try {
      const response = await messageApi.get(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create/Post a new message - Updated to match Postman structure
   * @param {Object} messageData - Message data object
   * @param {string} messageData.contenu - Message content
   * @param {Object} messageData.expediteur - Sender user object
   * @param {Array} messageData.destinataires - Array of recipient user objects
   * @param {string} messageData.etat - Message state (optional)
   * @returns {Promise<Object>} Created message object
   */
  async createMessage(messageData) {
    try {
      // Validate required fields
      if (!messageData.contenu) {
        throw new Error("Message content is required");
      }
      if (!messageData.expediteur || !messageData.expediteur.id) {
        throw new Error("Valid sender is required");
      }
      if (
        !messageData.destinataires ||
        messageData.destinataires.length === 0
      ) {
        throw new Error("At least one recipient is required");
      }

      // Prepare payload
      const messagePayload = {
        contenu: messageData.contenu,
        datecreation: new Date().toISOString(),
        datemodification: new Date().toISOString(),
        etat: messageData.etat || "envoyé",
        expediteur_id: messageData.expediteur.id,
        // Include other required fields from your schema
      };

      console.log("Sending message payload:", messagePayload);
      const response = await messageApi.post("/messages", messagePayload);
      return response.data;
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error(
        error.response?.data?.message || "Failed to send message"
      );
    }
  }

  /**
   * Update an existing message
   * @param {string} messageId - The ID of the message to update
   * @param {Object} messageData - Updated message data
   * @returns {Promise<Object>} Updated message object
   */
  async updateMessage(messageId, messageData) {
    try {
      // Prepare user objects if they exist in the update
      const expediteur = messageData.expediteur
        ? this.prepareUserForBackend(messageData.expediteur)
        : undefined;

      const destinataires = messageData.destinataires
        ? messageData.destinataires.map((dest) =>
            this.prepareUserForBackend(dest)
          )
        : undefined;

      // Add modification date in the correct format
      const updatePayload = {
        ...messageData,
        ...(expediteur && { expediteur }),
        ...(destinataires && { destinataires }),
        dateModification: this.formatDateForBackend(),
      };

      const response = await messageApi.put(
        `/messages/${messageId}`,
        updatePayload
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a message (with fallback to POST if DELETE isn't supported)
   * @param {string} messageId - The ID of the message to delete
   * @returns {Promise<Object>} Success response
   */
  async deleteMessage(messageId) {
    try {
      await messageApi.delete(`/messages/${messageId}`);
      return { success: true, message: "Message deleted successfully" };
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Message Filtering and Search ============
  /**
   * Get messages by sender
   * @param {string} senderId - ID of the sender
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages from the sender
   */
  async getMessagesBySender(senderId, page = 1, limit = 10) {
    try {
      const response = await messageApi.get("/messages", {
        params: {
          senderId,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get messages for a specific recipient
   * @param {string} recipientId - ID of the recipient
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages for the recipient
   */
  async getMessagesByRecipient(recipientId, page = 1, limit = 10) {
    try {
      const response = await messageApi.get("/messages", {
        params: {
          recipientId,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get messages by state/status
   * @param {string} etat - Message state (e.g., "envoyé", "lu", "non lu")
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages with the specified state
   */
  async getMessagesByState(etat, page = 1, limit = 10) {
    try {
      const response = await messageApi.get("/messages", {
        params: {
          etat,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search messages by content
   * @param {string} searchTerm - Term to search for in message content
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages matching the search term
   */
  async searchMessages(searchTerm, page = 1, limit = 10) {
    try {
      const response = await messageApi.get("/messages", {
        params: {
          search: searchTerm,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Conversation Management ============
  /**
   * Get messages between two users (conversation)
   * @param {string} userId1 - ID of the first user
   * @param {string} userId2 - ID of the second user
   * @param {number} page - Page number for pagination (optional)
   * @param {number} limit - Number of messages per page (optional)
   * @returns {Promise<Array>} Array of messages in the conversation
   */
  async getConversation(userId1, userId2, page = 1, limit = 50) {
    try {
      const response = await messageApi.get("/messages/conversation", {
        params: {
          user1: userId1,
          user2: userId2,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Message State Management ============
  /**
   * Mark a message as read
   * @param {string} messageId - The ID of the message to mark as read
   * @returns {Promise<Object>} Updated message object
   */
  async markAsRead(messageId) {
    try {
      const response = await messageApi.patch(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark a message as unread
   * @param {string} messageId - The ID of the message to mark as unread
   * @returns {Promise<Object>} Updated message object
   */
  async markAsUnread(messageId) {
    try {
      const response = await messageApi.patch(`/messages/${messageId}/unread`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Bulk Operations ============
  /**
   * Send message to multiple recipients
   * @param {Object} messageData - Message data
   * @param {string} messageData.contenu - Message content
   * @param {Object} messageData.expediteur - Sender user object
   * @param {Array} recipientIds - Array of recipient user IDs
   * @returns {Promise<Array>} Array of created message objects
   */
  async sendBulkMessage(messageData, recipientIds) {
    try {
      const bulkMessageData = {
        contenu: messageData.contenu,
        expediteur: this.prepareUserForBackend(messageData.expediteur),
        recipientIds: recipientIds.map((id) => ({
          id,
          type: this.mapRoleToBackendType(messageData.expediteur.role),
        })),
        etat: messageData.etat || "envoyé",
      };

      const response = await messageApi.post("/messages/bulk", bulkMessageData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete multiple messages (with fallback to POST if DELETE isn't supported)
   * @param {Array} messageIds - Array of message IDs to delete
   * @returns {Promise<Object>} Success response
   */
  async deleteMultipleMessages(messageIds) {
    try {
      const response = await messageApi.delete("/messages/bulk", {
        data: { messageIds },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Utility Method for Quick Message Creation ============
  /**
   * Create a message with simplified user objects (convenience method)
   * @param {string} contenu - Message content
   * @param {Object} sender - Simplified sender object
   * @param {Array} recipients - Array of simplified recipient objects
   * @param {string} etat - Message state (optional)
   * @returns {Promise<Object>} Created message object
   */
  async createSimpleMessage(contenu, sender, recipients, etat = "envoyé") {
    const messageData = {
      contenu,
      expediteur: {
        type: sender.type || "utilisateur",
        id: sender.id,
        nom: sender.nom,
        prenom: sender.prenom,
        email: sender.email,
        resetPasswordToken: sender.resetPasswordToken || null,
        telephone: sender.telephone || "",
        adresse: sender.adresse || "",
        activationToken: sender.activationToken || null,
        etat: sender.etat || "ACTIVE",
        creationDate: sender.creationDate || new Date().toISOString(),
        admin: sender.admin || false,
      },
      destinataires: recipients.map((recipient) => ({
        type: recipient.type || "utilisateur",
        id: recipient.id,
        nom: recipient.nom,
        prenom: recipient.prenom,
        email: recipient.email,
        resetPasswordToken: recipient.resetPasswordToken || null,
        telephone: recipient.telephone || "",
        adresse: recipient.adresse || "",
        activationToken: recipient.activationToken || null,
        etat: recipient.etat || "ACTIVE",
        creationDate: recipient.creationDate || new Date().toISOString(),
        admin: recipient.admin || false,
      })),
      etat,
    };

    return this.createMessage(messageData);
  }
  async starMessage(messageId) {
    try {
      const response = await messageApi.patch(`/messages/${messageId}`, {
        starred: true,
        dateModification: this.formatDateForBackend(),
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async unstarMessage(messageId) {
    try {
      const response = await messageApi.patch(`/messages/${messageId}`, {
        starred: false,
        dateModification: this.formatDateForBackend(),
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const messageService = new MessageService();
