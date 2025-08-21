import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const activityFeedApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

activityFeedApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class ActivityFeedService {
  // Method to get current user - this was missing!
  getCurrentUser() {
    try {
      // Get user data from localStorage - check multiple possible keys
      const possibleKeys = ["userData", "currentUser", "user"];
      let userData = null;

      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            userData = JSON.parse(data);
            break;
          } catch (e) {
            continue;
          }
        }
      }

      // If no userData found, try to construct from individual localStorage items
      if (!userData) {
        const userId = localStorage.getItem("userId");
        const userEmail =
          localStorage.getItem("userEmail") || localStorage.getItem("email");
        const username =
          localStorage.getItem("username") || localStorage.getItem("name");
        const userRole =
          localStorage.getItem("userRole") || localStorage.getItem("role");

        if (userId && userEmail) {
          userData = {
            id: userId,
            email: userEmail,
            name: username || "User",
            role: userRole || "student",
          };
        }
      }

      if (userData) {
        return {
          id: userData.id,
          name: userData.name || userData.username || "User",
          email: userData.email,
          role: userData.role || "student",
          avatar: userData.avatar || "/api/placeholder/48/48",
        };
      }

      // Return a default user if no user data found
      return {
        id: "user_1",
        name: "Current User",
        email: "user@example.com",
        role: "student",
        avatar: "/api/placeholder/48/48",
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      // Return default user on error
      return {
        id: "user_1",
        name: "Current User",
        email: "user@example.com",
        role: "student",
        avatar: "/api/placeholder/48/48",
      };
    }
  }

  // Method to get a valid professor ID - referenced in CreateEventModal
  getValidProfessorId() {
    // Get the real user ID from localStorage
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    if (userId && (userRole === "professor" || userRole === "admin")) {
      console.log("Using real professor ID:", userId);
      return userId;
    }

    const currentUser = this.getCurrentUser();

    // If current user is a professor, use their ID
    if (currentUser.role === "professor" || currentUser.role === "admin") {
      console.log("Using current user ID:", currentUser.id);
      return currentUser.id;
    }

    // Log warning and return the real user ID anyway (fallback)
    console.warn(
      "User role not professor, but using their ID anyway:",
      userId || currentUser.id
    );
    return userId || currentUser.id;
  }

  // Method to get activities - referenced in ActivitiesContent
  async getActivities(filter = "all") {
    try {
      console.log("Fetching activities with filter:", filter);

      let endpoint = "/evenements";

      // Apply filter if needed
      if (filter !== "all") {
        endpoint += `?type=${filter}`;
      }

      const response = await activityFeedApi.get(endpoint);
      console.log("Raw events response:", response.data);

      const events = response.data;

      // Handle case where backend returns empty or null data
      if (!events || (Array.isArray(events) && events.length === 0)) {
        console.log("No events found, returning empty array");
        return [];
      }

      // Transform events to activities format
      const activities = this.transformEventsToActivities(events);
      console.log("Transformed activities:", activities);

      return activities;
    } catch (error) {
      console.error("Failed to fetch activities:", error);

      // If it's a network error, return empty array instead of throwing
      if (error.code === "NETWORK_ERROR" || error.request) {
        console.warn("Network error, returning empty activities list");
        return [];
      }

      // For other errors, still throw so the UI can show an error message
      this.handleError(error);
    }
  }

  // Transform events to activities format
  transformEventsToActivities(events) {
    if (!Array.isArray(events)) {
      console.warn("Events is not an array:", events);
      return [];
    }

    return events.map((event) => {
      // Get creator info from localStorage or default
      const currentUser = this.getCurrentUser();

      return {
        id: event.id,
        type: "event",
        user: {
          id: event.createurId || currentUser.id,
          name: currentUser.name || "Event Creator",
          role: currentUser.role || "professor",
          avatar: "/api/placeholder/48/48",
        },
        timestamp: this.formatTimestamp(event.heureDebut),
        content: `New event: ${event.titre}`,
        eventDetails: {
          title: event.titre,
          description: event.description,
          location: event.lieu,
          status: event.etat,
          startTime: event.heureDebut,
          endTime: event.heureFin,
          participantsCount: event.participantsIds?.length || 0,
        },
        media: event.medias || [],
        likes: Math.floor(Math.random() * 10), // Mock data
        comments: [], // Mock data
        commentsCount: 0,
      };
    });
  }

  // Method to like an activity
  async likeActivity(activityId) {
    try {
      // Since your API doesn't have a like endpoint, we'll mock this
      console.log(`Liked activity ${activityId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to share an activity
  async shareActivity(activityId) {
    try {
      // Mock share functionality
      console.log(`Shared activity ${activityId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to join an event
  async joinEvent(eventId) {
    try {
      // Mock join event functionality
      console.log(`Joined event ${eventId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to comment on activity
  async commentOnActivity(activityId, comment) {
    try {
      // Mock comment functionality
      console.log(`Comment on activity ${activityId}: ${comment}`);
      return {
        id: Date.now(),
        content: comment,
        user: this.getCurrentUser(),
        timestamp: new Date().toLocaleString(),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to create event (alias for creerEvenement)
  async createEvent(eventData) {
    return this.creerEvenement(eventData);
  }

  // Method to upload media
  async uploadMedia(file, type = "IMAGE", context = "EVENT") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("context", context);

      // Since your API might not have a media upload endpoint,
      // we'll create a mock response with required fields
      const mockMedia = {
        id: Date.now().toString(),
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        filePath: URL.createObjectURL(file), // Create a temporary URL for preview
        bucketName: "default-bucket", // Required field to avoid null constraint
        type: type,
        context: context,
      };

      console.log("Mock media upload:", mockMedia);
      return mockMedia;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Utility methods for formatting
  formatEventDateTime(dateTime) {
    try {
      return new Date(dateTime).toLocaleString();
    } catch (error) {
      return "Invalid date";
    }
  }

  formatTimestamp(dateTime) {
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return "Just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    } catch (error) {
      return "Unknown time";
    }
  }

  getStatusColor(status) {
    switch (status) {
      case "A_VENIR":
        return "bg-blue-100 text-blue-800";
      case "EN_COURS":
        return "bg-green-100 text-green-800";
      case "TERMINE":
        return "bg-gray-100 text-gray-800";
      case "ANNULE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getStatusLabel(status) {
    switch (status) {
      case "A_VENIR":
        return "Upcoming";
      case "EN_COURS":
        return "In Progress";
      case "TERMINE":
        return "Completed";
      case "ANNULE":
        return "Cancelled";
      default:
        return "Unknown";
    }
  }

  // Existing methods
  async creerEvenement(evenementData) {
    try {
      if (
        !evenementData.titre ||
        !evenementData.heureDebut ||
        !evenementData.createurId
      ) {
        throw new Error(
          "Missing required fields: titre, heureDebut, or createurId"
        );
      }
      const response = await activityFeedApi.post("/evenements", evenementData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirTousEvenements() {
    try {
      const response = await activityFeedApi.get("/evenements");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async mettreAJourEvenement(id, evenementData) {
    try {
      if (!id) {
        throw new Error("Event ID is required");
      }
      const response = await activityFeedApi.put(
        `/evenements/${id}`,
        evenementData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async supprimerEvenement(id) {
    try {
      if (!id) {
        throw new Error("Event ID is required");
      }
      await activityFeedApi.delete(`/evenements/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirEvenementParId(id) {
    try {
      if (!id) {
        throw new Error("Event ID is required");
      }
      const response = await activityFeedApi.get(`/evenements/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirEvenementsParProfesseur(professeurId) {
    try {
      if (!professeurId) {
        throw new Error("Professor ID is required");
      }
      const response = await activityFeedApi.get(
        `/evenements/professeur/${professeurId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error("Request setup error: " + error.message);
    }
  }
}

export const activityFeedService = new ActivityFeedService();
