import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const activityFeedApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor with debugging
activityFeedApi.interceptors.request.use((config) => {
  // Debug: Log the full URL being requested
  console.log(
    `Making ${config.method?.toUpperCase()} request to:`,
    config.baseURL + config.url
  );

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    // Debug FormData contents
    console.log("FormData contents:");
    for (let [key, value] of config.data.entries()) {
      console.log(`${key}:`, value);
    }
  } else {
    config.headers["Content-Type"] = "application/json";
    // Debug JSON payload
    console.log("Request payload:", JSON.stringify(config.data, null, 2));
  }

  return config;
});

// Enhanced response interceptor with better debugging
activityFeedApi.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - Status: ${response.status}`
    );
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error(`❌ Request failed:`, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      baseURL: error.config?.baseURL,
      fullURL: error.config
        ? error.config.baseURL + error.config.url
        : "Unknown",
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem("accessToken");
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          break;
        case 403:
          console.error("Forbidden access:", error.response.data);
          break;
        case 404:
          console.error("Resource not found:", error.response.config.url);
          console.error(
            "Full URL attempted:",
            error.config?.baseURL + error.config?.url
          );
          break;
        case 500:
          console.error("Server error:", error.response.data);
          break;
        default:
          console.error(
            "API Error:",
            error.response.status,
            error.response.data
          );
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

class ActivityFeedService {
  handleError(error) {
    let errorMessage = "An error occurred";

    if (error.response) {
      errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error (${error.response.status})`;

      if (error.response.status === 404) {
        // Provide more specific error messages for 404s
        if (error.response.data?.message?.includes("Professeur introuvable")) {
          errorMessage =
            "Invalid professor ID. Please contact your administrator to set up your professor account.";
        } else {
          errorMessage = "Requested resource not found";
        }
      } else if (error.response.status === 500) {
        errorMessage = "Internal server error";
      }
    } else if (error.request) {
      errorMessage = "No response from server. Please check your connection.";
    } else {
      errorMessage = error.message || "Error setting up request";
    }

    console.error("API Error:", errorMessage, error);
    throw new Error(errorMessage);
  }

  // Test connection to the API
  async testConnection() {
    try {
      console.log("Testing API connection...");
      const response = await activityFeedApi.get("/");
      console.log("✅ API connection successful:", response.data);
      return true;
    } catch (error) {
      console.error("❌ API connection failed:", error);
      return false;
    }
  }

  // Test if evenements endpoint exists
  async testEvenementsEndpoint() {
    try {
      console.log("Testing /evenements endpoint...");
      // Test OPTIONS first (for CORS)
      try {
        const optionsResponse = await activityFeedApi.options("/evenements");
        console.log("✅ OPTIONS request successful:", optionsResponse);
      } catch (optionsError) {
        console.warn("OPTIONS request failed (might be normal):", optionsError);
      }

      // Then test POST with the working UUID
      const testData = {
        titre: "Test Event",
        description: "Test Description",
        lieu: "Test Location",
        etat: "A_VENIR",
        heureDebut: new Date().toISOString(),
        heureFin: new Date(Date.now() + 3600000).toISOString(),
        createurId: "550e8400-e29b-41d4-a716-446655440007", // Use the working UUID
        participantsIds: [],
      };

      const response = await activityFeedApi.post("/evenements", testData);
      console.log("✅ /evenements POST successful:", response.data);
      return true;
    } catch (error) {
      console.error("❌ /evenements POST failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);
      }
      return false;
    }
  }
  async uploadMedia(file, mediaType = "PHOTO", documentType = null) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error("User must be logged in to upload media");
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);

      // First get the presigned URL from the server
      const presignedUrlResponse = await activityFeedApi.post(
        "/media/presigned-url",
        {
          fileName: file.name,
          contentType: file.type,
          mediaType: mediaType,
          ownerId: currentUser.id,
          documentType: documentType,
        }
      );

      const { url: presignedUrl, fileName: sanitizedFileName } =
        presignedUrlResponse.data;

      // Now upload the file directly to S3 using the presigned URL
      const uploadResponse = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        withCredentials: false, // Important for presigned URLs
      });

      console.log("✅ Media uploaded successfully:", uploadResponse);

      // Return the file path and metadata
      return {
        fileName: sanitizedFileName,
        filePath: presignedUrl.split("?")[0], // Remove query params
        contentType: file.type,
        mediaType: mediaType,
        documentType: documentType,
      };
    } catch (error) {
      console.error("❌ Failed to upload media:", error);
      this.handleError(error);
    }
  }
  // ========== ACTIVITY/POSTS METHODS ==========

  async getActivities(filter = "all") {
    try {
      let activities = [];

      if (filter === "all" || filter === "event") {
        const events = await this.getAllEvents();
        activities = [
          ...activities,
          ...this.transformEventsToActivities(events),
        ];
      }

      if (filter === "all" || filter === "academic") {
        const channels = await this.getAllChannels();
        activities = [
          ...activities,
          ...this.transformChannelsToActivities(channels),
        ];
      }

      return activities.sort(
        (a, b) => new Date(b.rawTimestamp) - new Date(a.rawTimestamp)
      );
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  transformEventsToActivities(events) {
    if (!Array.isArray(events)) return [];

    return events.map((event) => ({
      id: event.id,
      content: event.description || event.titre || "",
      timestamp: this.formatTimestamp(event.heureDebut),
      rawTimestamp: event.heureDebut,
      user: {
        id: event.createurId || "unknown",
        name: event.createurNom || event.createurId || "Unknown User",
        role: "Professor",
        avatar: "/api/placeholder/48/48",
      },
      media: event.medias || [],
      likes: 0,
      commentsCount: 0,
      comments: [],
      type: "event",
      eventDetails: {
        title: event.titre,
        location: event.lieu,
        startTime: event.heureDebut,
        endTime: event.heureFin,
        status: event.etat,
        participantsCount: event.participantsIds?.length || 0,
      },
    }));
  }
  async getMediaDownloadUrl(filePath) {
    try {
      // Extract the media ID from the file path if needed
      const mediaId = filePath.split("/").pop().split("?")[0];

      const response = await activityFeedApi.get(
        `/media/${mediaId}/download-url`
      );
      return response.data.url;
    } catch (error) {
      console.error("Failed to get download URL:", error);
      this.handleError(error);
      return null;
    }
  }
  transformChannelsToActivities(channels) {
    if (!Array.isArray(channels)) return [];

    return channels.map((channel) => ({
      id: channel.id,
      content: channel.description || `New channel: ${channel.nom}`,
      timestamp: "Recently",
      rawTimestamp: new Date(),
      user: {
        id: channel.professeur?.id || "unknown",
        name:
          channel.professeur?.nom ||
          channel.professeur?.prenom ||
          "Unknown Professor",
        role: "Professor",
        avatar: "/api/placeholder/48/48",
      },
      media: [],
      likes: 0,
      commentsCount: 0,
      comments: [],
      type: "channel",
      channelDetails: {
        name: channel.nom,
        className: channel.classe?.nom || "Unknown Class",
      },
    }));
  }

  formatTimestamp(dateTime) {
    if (!dateTime) return "Just now";
    const date = new Date(dateTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  // Get valid professor UUID - this is the key fix
  getValidProfessorId() {
    // First check if we have a stored valid professor UUID
    const storedProfessorId = localStorage.getItem("professorUUID");
    if (storedProfessorId && this.isValidUUID(storedProfessorId)) {
      return storedProfessorId;
    }

    // Use the working UUID from your test as a fallback
    // TODO: Replace this with proper user UUID mapping
    const fallbackUUID = "550e8400-e29b-41d4-a716-446655440007";
    console.warn(
      "Using fallback professor UUID. This should be replaced with proper user mapping."
    );
    return fallbackUUID;
  }

  // Helper to validate UUID format
  isValidUUID(str) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(str);
  }

  async createActivity(content, images = []) {
    try {
      console.log("Création d'une activité avec contenu:", content);

      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error(
          "L'utilisateur doit être connecté pour créer des activités"
        );
      }

      // Téléchargement des médias
      const mediaUploads = [];
      if (images.length > 0) {
        for (const image of images) {
          console.log("Téléchargement du média:", image.name);
          const media = await this.uploadMedia(image, "PHOTO", "EVENT");
          mediaUploads.push({
            fileName: media.fileName,
            filePath: media.filePath,
            contentType: media.contentType,
            mediaType: media.mediaType,
          });
        }
      }

      // Utilisation de l'UUID valide du professeur
      const validProfessorId = this.getValidProfessorId();

      // Préparation des données de l'événement
      const requestData = {
        titre: content.substring(0, 100) || "Nouvelle publication",
        description: content,
        lieu: "Salle de conférence",
        etat: "A_VENIR",
        heureDebut: new Date().toISOString(),
        heureFin: new Date(Date.now() + 3600000).toISOString(),
        createurId: validProfessorId,
        participantsIds: [],
        medias: mediaUploads,
      };

      console.log("Envoi de la requête POST à /evenements...");
      const response = await activityFeedApi.post("/evenements", requestData);
      console.log("✅ Activité créée avec succès:", response.data);

      return this.transformEventsToActivities([response.data])[0];
    } catch (error) {
      console.error("❌ Échec de la création de l'activité:", error);
      this.handleError(error);
    }
  }

  // Add this debugging method to test the exact endpoint
  async debugPostEndpoint() {
    try {
      console.log("🔍 Testing POST endpoint with exact Postman data...");

      const testData = {
        titre: "Réunion parents-professeurssd",
        description: "Réunion trimestriellsasfdfs",
        lieu: "Salle 101",
        etat: "A_VENIR",
        heureDebut: "2023-12-15T14:00:00",
        heureFin: "2023-12-15T16:00:00",
        createurId: "550e8400-e29b-41d4-a716-446655440007", // Use your working UUID
        participantsIds: [],
      };

      console.log("Test data:", JSON.stringify(testData, null, 2));
      console.log("Full URL:", BASE_URL + "/evenements");

      const response = await activityFeedApi.post("/evenements", testData);
      console.log("✅ Debug POST successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Debug POST failed:");
      console.error("Error message:", error.message);
      console.error("Error config:", error.config);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }

  // ========== EVENT METHODS ==========

  async createEvent(eventData) {
    try {
      console.log("Creating event with data:", eventData);
      const response = await activityFeedApi.post("/evenements", eventData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEvent(id, eventData) {
    try {
      const response = await activityFeedApi.put(
        `/evenements/${id}`,
        eventData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteEvent(id) {
    try {
      await activityFeedApi.delete(`/evenements/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEventById(id) {
    try {
      const response = await activityFeedApi.get(`/evenements/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAllEvents() {
    try {
      const response = await activityFeedApi.get("/evenements");
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getEventsByProfessor(professorId) {
    try {
      const response = await activityFeedApi.get(
        `/evenements/professeur/${professorId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  // ========== CHANNEL METHODS ==========

  async createChannel(channelData) {
    try {
      const response = await activityFeedApi.post("/canaux", channelData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateChannel(id, channelData) {
    try {
      const response = await activityFeedApi.put(`/canaux/${id}`, channelData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteChannel(id) {
    try {
      await activityFeedApi.delete(`/canaux/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getChannelById(id) {
    try {
      const response = await activityFeedApi.get(`/canaux/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAllChannels() {
    try {
      const response = await activityFeedApi.get("/canaux");
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getChannelsByClass(classId) {
    try {
      const response = await activityFeedApi.get(`/canaux/classe/${classId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getChannelsByProfessor(professorId) {
    try {
      const response = await activityFeedApi.get(
        `/canaux/professeur/${professorId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  // ========== USER METHODS ==========

  getCurrentUser() {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");
    const username = localStorage.getItem("username");
    const userRole = localStorage.getItem("userRole");

    console.log("Getting current user from localStorage:", {
      userId,
      userEmail,
      username,
      userRole,
    });

    if (userId && userEmail) {
      return {
        id: userId,
        email: userEmail,
        name: username || userEmail.split("@")[0],
        role: userRole || "user",
      };
    }

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    if (!token) {
      console.log("No token found in localStorage");
      return null;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);

      console.log("Decoded token:", decoded);

      return {
        id: userId || decoded.userId || decoded.sub,
        email: userEmail || decoded.email || decoded.sub,
        name: username || decoded.name || decoded.sub?.split("@")[0],
        role: userRole || decoded.roles?.[0] || decoded.role,
        roles: decoded.roles || [decoded.role],
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  // ========== UTILITY METHODS ==========

  async getActivityStats() {
    try {
      const [events, channels] = await Promise.all([
        this.getAllEvents(),
        this.getAllChannels(),
      ]);

      const today = new Date().toDateString();
      const todayEvents = events.filter(
        (event) => new Date(event.heureDebut).toDateString() === today
      );

      return {
        newPostsToday: todayEvents.length,
        activeUsers: new Set(
          [
            ...events.map((e) => e.createurId),
            ...channels.map((c) => c.professeur?.id),
          ].filter(Boolean)
        ).size,
        totalInteractions: events.length + channels.length,
      };
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return {
        newPostsToday: 0,
        activeUsers: 0,
        totalInteractions: 0,
      };
    }
  }

  async getUpcomingEvents() {
    try {
      const events = await this.getAllEvents();
      const now = new Date();

      return events
        .filter((event) => new Date(event.heureDebut) > now)
        .sort((a, b) => new Date(a.heureDebut) - new Date(b.heureDebut))
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          title: event.titre,
          date: this.formatEventDate(event.heureDebut),
          location: event.lieu,
        }));
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error);
      return [];
    }
  }

  formatEventDate(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ========== PLACEHOLDER METHODS ==========

  async likeActivity(activityId) {
    console.log(
      `Like functionality not yet implemented for activity ${activityId}`
    );
    return null;
  }

  async getComments(activityId) {
    console.log(
      `Comments functionality not yet implemented for activity ${activityId}`
    );
    return [];
  }

  async addComment(activityId, content) {
    console.log(
      `Add comment functionality not yet implemented for activity ${activityId}`
    );
    return null;
  }

  async getActivityById(activityId) {
    try {
      try {
        const event = await this.getEventById(activityId);
        return this.transformEventsToActivities([event])[0];
      } catch (eventError) {
        const channel = await this.getChannelById(activityId);
        return this.transformChannelsToActivities([channel])[0];
      }
    } catch (error) {
      console.error(`Failed to fetch activity ${activityId}:`, error);
      return null;
    }
  }

  // ========== DEBUG METHODS ==========

  async debugEverything() {
    console.log("🔍 Starting comprehensive debug...");

    console.log("1. Testing basic connection...");
    await this.testConnection();

    console.log("2. Testing current user...");
    const user = this.getCurrentUser();
    console.log("Current user:", user);

    console.log("3. Testing exact Postman data...");
    await this.debugPostEndpoint();

    console.log("4. Checking localStorage items...");
    console.log("Available localStorage keys:", Object.keys(localStorage));

    console.log("🔍 Debug complete!");
  }
}

export const activityFeedService = new ActivityFeedService();
