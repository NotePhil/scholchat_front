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
    
    if (userRole === 'ROLE_PROFESSOR' || userRole === 'professor') {
      return userId || authResponse.userId;
    }
    
    const finalId = userId || authResponse.userId;
    console.log('Final professor ID:', finalId);
    console.log('========================');
    
    return finalId;
  }

  async getActivities() {
    try {
      const response = await activityFeedApi.get("/evenements");
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }

  async likeEvent(eventId) {
    try {
      await activityFeedApi.post(`/evenements/${eventId}/like`);
      return true;
    } catch (error) {
      console.error("Failed to like event:", error);
      throw error;
    }
  }

  async commentOnEvent(eventId, comment) {
    try {
      await activityFeedApi.post(`/evenements/${eventId}/comment`, { content: comment });
      return true;
    } catch (error) {
      console.error("Failed to comment on event:", error);
      throw error;
    }
  }

  async joinEvent(eventId) {
    try {
      await activityFeedApi.post(`/evenements/${eventId}/join`);
      return true;
    } catch (error) {
      console.error("Failed to join event:", error);
      throw error;
    }
  }

  async unjoinEvent(eventId) {
    try {
      await activityFeedApi.post(`/evenements/${eventId}/unjoin`);
      return true;
    } catch (error) {
      console.error("Failed to unjoin event:", error);
      throw error;
    }
  }

  async editEvent(eventId, eventData) {
    try {
      const createurId = await this.getProfessorId();
      if (!createurId) {
        throw new Error("Professor ID not found. Please ensure you are logged in as a professor.");
      }

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
        etat: "PLANIFIE",
        createurId: createurId,
        participantsIds: eventData.participantsIds || [],
        medias: cleanedMedias,
        visibility: eventData.visibility,
        selectedClasses: eventData.selectedClasses || []
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

  async createEvent(eventData) {
    try {
      const createurId = await this.getProfessorId();
      if (!createurId) {
        throw new Error("Professor ID not found. Please ensure you are logged in as a professor.");
      }

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
        etat: "PLANIFIE",
        createurId: createurId,
        participantsIds: eventData.participantsIds || [],
        medias: cleanedMedias,
        visibility: eventData.visibility,
        selectedClasses: eventData.selectedClasses || []
      };

      console.log("Creating event with payload:", eventPayload);
      
      const response = await activityFeedApi.post("/evenements", eventPayload);
      
      console.log('Event creation response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error("Failed to create event:", error);
      console.error("Error details:", error.response?.data);
      
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