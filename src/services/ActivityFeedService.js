import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
      localStorage.getItem("accessToken") ||
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
  // Get current user with proper UUID
  getCurrentUser() {
    try {
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const username = localStorage.getItem("username");
      const userRole = localStorage.getItem("userRole");

      const decodedToken = JSON.parse(
        localStorage.getItem("decodedToken") || "{}"
      );
      const authResponse = JSON.parse(
        localStorage.getItem("authResponse") || "{}"
      );

      return {
        id: userId || authResponse.userId || "unknown",
        name:
          username ||
          authResponse.username ||
          userEmail?.split("@")[0] ||
          "Current User",
        email:
          userEmail ||
          decodedToken.sub ||
          authResponse.userEmail ||
          "user@example.com",
        role: userRole || authResponse.userType || "student",
        avatar: "/api/placeholder/48/48",
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return {
        id: "unknown",
        name: "Current User",
        email: "user@example.com",
        role: "student",
        avatar: "/api/placeholder/48/48",
      };
    }
  }

  // Get valid user ID for API calls
  getValidUserId() {
    const userId = localStorage.getItem("userId");
    const authResponse = JSON.parse(
      localStorage.getItem("authResponse") || "{}"
    );

    const finalUserId = userId || authResponse.userId;

    if (!finalUserId || finalUserId.includes("@") || finalUserId === "user_1") {
      console.error("Invalid or missing userId detected:", finalUserId);
      throw new Error("Authentication error: Invalid user ID");
    }

    return finalUserId;
  }

  async getProfessorId() {
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const authResponse = JSON.parse(localStorage.getItem("authResponse") || "{}");
    
    console.log('=== PROFESSOR ID DEBUG ===');
    console.log('userRole:', userRole);
    console.log('userId:', userId);
    
    // For admin users, try to get the first available professor ID from backend
    if (userRole === 'ROLE_ADMIN' || userRole === 'admin') {
      try {
        const response = await activityFeedApi.get('/professeurs');
        const professors = response.data;
        if (professors && professors.length > 0) {
          console.log('Using first available professor ID for admin:', professors[0].id);
          return professors[0].id;
        }
      } catch (error) {
        console.warn('Could not fetch professors for admin, using userId:', error);
      }
    }
    
    // For professor users, use their userId directly
    if (userRole === 'ROLE_PROFESSOR' || userRole === 'professor') {
      return userId || authResponse.userId;
    }
    
    // Fallback to userId for other cases
    const finalId = userId || authResponse.userId;
    console.log('Final professor ID:', finalId);
    console.log('========================');
    
    return finalId;
  }

  // Get raw events from API
  async getActivities() {
    try {
      const response = await activityFeedApi.get("/evenements");
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }



  // Like an event
  async likeEvent(eventId) {
    try {
      const userId = this.getValidUserId();
      const interaction = {
        type: "LIKE",
        content: "",
        niveau: "INFO",
        createdById: userId,
        eventId: eventId
      };
      await activityFeedApi.post("/interactions", interaction);
      return true;
    } catch (error) {
      console.error("Failed to like event:", error);
      throw error;
    }
  }

  // Comment on event
  async commentOnEvent(eventId, comment) {
    try {
      const userId = this.getValidUserId();
      const interaction = {
        type: "COMMENT",
        content: comment,
        niveau: "INFO",
        createdById: userId,
        eventId: eventId
      };
      await activityFeedApi.post("/interactions", interaction);
      return true;
    } catch (error) {
      console.error("Failed to comment on event:", error);
      throw error;
    }
  }

  // Join event
  async joinEvent(eventId) {
    try {
      const userId = this.getValidUserId();
      await activityFeedApi.post(`/interactions/join/${eventId}/${userId}`);
      return true;
    } catch (error) {
      console.error("Failed to join event:", error);
      throw error;
    }
  }

  // Leave event (unjoin)
  async unjoinEvent(eventId) {
    try {
      const userId = this.getValidUserId();
      await activityFeedApi.post(`/interactions/unjoin/${eventId}/${userId}`);
      return true;
    } catch (error) {
      console.error("Failed to unjoin event:", error);
      throw error;
    }
  }

  // Edit event
  async editEvent(eventId, eventData) {
    try {
      const createurId = await this.getProfessorId();
      if (!createurId) {
        throw new Error("Professor ID not found. Please ensure you are logged in as a professor.");
      }

      // Clean and validate media data
      let cleanedMedias = [];
      if (eventData.medias && eventData.medias.length > 0) {
        cleanedMedias = eventData.medias.map(media => ({
          fileName: media.fileName,
          filePath: media.filePath,
          fileType: media.fileType || media.mediaType || "IMAGE",
          contentType: media.contentType,
          fileSize: media.fileSize,
          mediaType: media.mediaType || "IMAGE",
          bucketName: media.bucketName || "ressources"
        }));
      }

      const eventPayload = {
        titre: eventData.titre,
        description: eventData.description,
        lieu: eventData.lieu,
        heureDebut: eventData.heureDebut,
        heureFin: eventData.heureFin,
        etat: eventData.etat || "PLANIFIE",
        createurId: createurId,
        participantsIds: eventData.participantsIds || [],
        medias: cleanedMedias
      };

      console.log("Updating event with payload:", eventPayload);
      
      const response = await activityFeedApi.put(`/evenements/${eventId}`, eventPayload);
      
      console.log('Event update response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error("Failed to update event:", error);
      console.error("Error details:", error.response?.data);
      
      throw new Error(`Failed to update event: ${error.response?.data?.message || error.message}`);
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      console.log("Deleting event with ID:", eventId);
      
      const response = await activityFeedApi.delete(`/evenements/${eventId}`);
      
      console.log('Event deletion response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error("Failed to delete event:", error);
      console.error("Error details:", error.response?.data);
      
      throw new Error(`Failed to delete event: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create event
  async createEvent(eventData) {
    try {
      const createurId = await this.getProfessorId();
      if (!createurId) {
        throw new Error("Professor ID not found. Please ensure you are logged in as a professor.");
      }

      // Clean and validate media data
      let cleanedMedias = [];
      if (eventData.medias && eventData.medias.length > 0) {
        cleanedMedias = eventData.medias.map(media => ({
          fileName: media.fileName,
          filePath: media.filePath,
          fileType: media.fileType || media.mediaType || "IMAGE",
          contentType: media.contentType,
          fileSize: media.fileSize,
          mediaType: media.mediaType || "IMAGE",
          bucketName: media.bucketName || "ressources"
        }));
        
        console.log('Cleaned medias:', cleanedMedias);
      }

      const eventPayload = {
        titre: eventData.titre,
        description: eventData.description,
        lieu: eventData.lieu,
        heureDebut: eventData.heureDebut,
        heureFin: eventData.heureFin,
        etat: eventData.etat || "PLANIFIE",
        createurId: createurId,
        participantsIds: eventData.participantsIds || [],
        medias: cleanedMedias
      };

      console.log("Creating event with payload:", eventPayload);
      
      const response = await activityFeedApi.post("/evenements", eventPayload);
      
      console.log('Event creation response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error("Failed to create event:", error);
      console.error("Error details:", error.response?.data);
      
      // If it's a media-related error, try creating without media
      if (error.response?.status === 400 && eventData.medias?.length > 0) {
        console.warn('Retrying event creation without media due to error');
        const eventWithoutMedia = { ...eventData, medias: [] };
        return this.createEvent(eventWithoutMedia);
      }
      
      throw new Error(`Failed to create event: ${error.response?.data?.message || error.message}`);
    }
  }

}

export const activityFeedService = new ActivityFeedService();
 