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

  // Get all activities with proper data structure
  async getActivities(filter = "all") {
    try {
      console.log("Fetching activities with filter:", filter);

      const [eventsResponse, interactionsResponse] = await Promise.all([
        activityFeedApi.get("/evenements").catch((err) => {
          console.warn("Failed to fetch events:", err);
          return { data: [] };
        }),
        activityFeedApi.get("/interactions").catch((err) => {
          console.warn("Failed to fetch interactions:", err);
          return { data: [] };
        }),
      ]);

      const events = eventsResponse.data || [];
      const interactions = interactionsResponse.data || [];

      console.log("Fetched events:", events.length);
      console.log("Fetched interactions:", interactions.length);

      // Get current user ID for checking likes
      const currentUserId = this.getValidUserId();

      // Transform events to activities with like status
      const eventActivities = await Promise.all(
        events.map(async (event) => {
          const activity = this.transformEventToActivity(event);

          // Check if current user has liked this event
          try {
            const hasLiked = await this.hasUserLikedEvent(
              event.id,
              currentUserId
            );
            activity.isLiked = hasLiked;
          } catch (error) {
            console.error("Error checking like status:", error);
            activity.isLiked = false;
          }

          return activity;
        })
      );

      // Transform interactions to activities
      const interactionActivities = interactions.map((interaction) =>
        this.transformInteractionToActivity(interaction)
      );

      // Combine and sort by timestamp
      const allActivities = [...eventActivities, ...interactionActivities].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      console.log("Total activities before filter:", allActivities.length);

      const filteredActivities = this.applyFilter(allActivities, filter);

      console.log("Activities after filter:", filteredActivities.length);

      return filteredActivities;
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      return this.getMockActivities(filter);
    }
  }

  // Check if user has liked an event
  async hasUserLikedEvent(eventId, userId) {
    try {
      const response = await activityFeedApi.get(
        `/interactions/event/${eventId}/user/${userId}/has-liked`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check like status:", error);
      return false;
    }
  }

  // Get like count for event
  async getEventLikeCount(eventId) {
    try {
      const response = await activityFeedApi.get(
        `/interactions/event/${eventId}/likes/count`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get like count:", error);
      return 0;
    }
  }

  // Like/Dislike an activity
  async addReaction(activityId, reactionType) {
    try {
      const userId = this.getValidUserId();

      // For likes, check current status first
      if (reactionType === "like") {
        try {
          const hasLiked = await this.hasUserLikedEvent(activityId, userId);
          if (hasLiked) {
            // Remove like
            await activityFeedApi.delete(`/interactions/event/${activityId}/user/${userId}/like`).catch(() => {
              // Fallback: create unlike interaction
              return activityFeedApi.post("/interactions", {
                type: "UNLIKE",
                content: "unliked this",
                createdById: userId,
                eventId: activityId,
              });
            });
            return false;
          }
        } catch (err) {
          console.warn("Could not check like status:", err);
        }
      }

      // Create new interaction
      const interaction = {
        type: reactionType.toUpperCase(),
        content: `${reactionType} this`,
        createdById: userId,
        eventId: activityId,
      };

      try {
        await activityFeedApi.post("/interactions", interaction);
      } catch (err) {
        if (err.response?.status === 404) {
          // Try alternative endpoint
          await activityFeedApi.post(`/events/${activityId}/like`, { userId });
        } else {
          throw err;
        }
      }
      return true;
    } catch (error) {
      console.error("Failed to add reaction:", error);
      throw error;
    }
  }

  // Remove reaction (dislike)
  async removeReaction(activityId) {
    try {
      // The removal is handled in addReaction by checking existing likes
      // This method is kept for backward compatibility
      return await this.addReaction(activityId, "like");
    } catch (error) {
      console.error("Failed to remove reaction:", error);
      throw error;
    }
  }

  // Comment on activity
  async commentOnActivity(activityId, comment) {
    try {
      const userId = this.getValidUserId();
      const interaction = {
        type: "COMMENT",
        content: comment,
        createdById: userId,
        eventId: activityId,
      };

      let response;
      try {
        response = await activityFeedApi.post("/interactions", interaction);
      } catch (err) {
        if (err.response?.status === 404) {
          // Try alternative endpoint
          response = await activityFeedApi.post(`/events/${activityId}/comments`, {
            content: comment,
            userId: userId
          });
        } else {
          throw err;
        }
      }

      const currentUser = this.getCurrentUser();
      return {
        id: response.data.id || Date.now().toString(),
        content: comment,
        user: currentUser,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to comment:", error);
      throw new Error(`Failed to post comment: ${error.response?.data?.message || error.message}`);
    }
  }

  // Share activity
  async shareActivity(activityId) {
    try {
      const interaction = {
        type: "SHARE",
        content: "shared this",
        createdById: this.getValidUserId(),
        eventId: activityId,
      };

      console.log("Sending share interaction:", interaction);
      await activityFeedApi.post("/interactions", interaction);
      return true;
    } catch (error) {
      console.error("Failed to share:", error);
      return false;
    }
  }

  // Join event
  async joinEvent(eventId) {
    try {
      const interaction = {
        type: "JOIN",
        content: "joined this event",
        createdById: this.getValidUserId(),
        eventId: eventId,
      };

      console.log("Sending join interaction:", interaction);
      await activityFeedApi.post("/interactions", interaction);
      return true;
    } catch (error) {
      console.error("Failed to join event:", error);
      return false;
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

  // Mock data for development/testing
  getMockActivities(filter) {
    const currentUser = this.getCurrentUser();

    const mockActivities = [
      {
        id: "event_1",
        type: "event",
        user: {
          id: "prof_1",
          name: "Dr. Sarah Johnson",
          role: "professor",
          avatar: "/api/placeholder/48/48",
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: "Physics Lab Session - Quantum Mechanics Experiments",
        eventDetails: {
          title: "Advanced Physics Lab",
          description:
            "Hands-on experiments with quantum mechanics principles.",
          location: "Science Building - Lab 204",
          status: "PLANIFIE",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          participantsCount: 24,
        },
        media: [
          {
            id: "1",
            fileName: "lab-equipment.jpg",
            filePath: "/api/placeholder/400/300",
            type: "IMAGE",
          },
        ],
        likes: 15,
        comments: [
          {
            id: "c1",
            content: "Can't wait for this session!",
            user: {
              id: "student_1",
              name: "Alex Chen",
              avatar: "/api/placeholder/32/32",
            },
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ],
        shares: 3,
        isLiked: false,
        isShared: false,
      },
      // ... other mock activities
    ];

    return this.applyFilter(mockActivities, filter);
  }

  // Transform event to activity
  transformEventToActivity(event) {
    const currentUser = this.getCurrentUser();

    // Ensure user object is always present
    const eventUser = {
      id: event.createurId || currentUser?.id || "unknown",
      name: event.createurNom || currentUser?.name || "Créateur d'événement",
      role: "professor",
      avatar: "/api/placeholder/48/48",
    };

    // Filter out invalid media and add proper structure
    let validMedia = [];
    if (event.medias && Array.isArray(event.medias)) {
      validMedia = event.medias
        .filter(media => media && (media.filePath || media.id))
        .map(media => ({
          id: media.id || media.fileName,
          fileName: media.fileName,
          filePath: media.filePath,
          type: media.fileType || media.mediaType || "IMAGE",
          mediaType: media.mediaType || "IMAGE",
          contentType: media.contentType,
          fileSize: media.fileSize
        }));
    }

    return {
      id: event.id,
      type: "event",
      user: eventUser,
      timestamp:
        event.heureDebut || event.dateCreation || new Date().toISOString(),
      content: `${event.titre}: ${event.description || "Nouvel événement créé"}`,
      eventDetails: {
        title: event.titre,
        description: event.description,
        location: event.lieu,
        status: event.etat,
        startTime: event.heureDebut,
        endTime: event.heureFin,
        participantsCount: event.participantsIds?.length || 0,
      },
      media: validMedia,
      likes: event.likesCount || 0,
      comments: event.comments || [],
      shares: event.sharesCount || 0,
      isLiked: false,
      isShared: false,
    };
  }

  // Transform interaction to activity
  transformInteractionToActivity(interaction) {
    const currentUser = this.getCurrentUser();

    // Ensure user object is always present
    const interactionUser = {
      id: interaction.createdById || currentUser?.id || "unknown",
      name: interaction.createdByName || currentUser?.name || "Utilisateur",
      role: interaction.createdByRole || "user",
      avatar: "/api/placeholder/48/48",
    };

    return {
      id: interaction.id,
      type: interaction.type === "COMMENT" ? "post" : "interaction",
      user: interactionUser,
      timestamp: interaction.creationDate || new Date().toISOString(),
      content: interaction.content,
      interactionType: interaction.type,
      likes: interaction.likesCount || 0,
      comments: interaction.comments || [],
      shares: interaction.sharesCount || 0,
      isLiked: false,
      isShared: false,
    };
  }

  // Apply filters with proper logic
  applyFilter(activities, filter) {
    switch (filter) {
      case "events":
        return activities.filter((activity) => activity.type === "event");
      case "posts":
        return activities.filter((activity) => activity.type === "post");
      case "interactions":
        return activities.filter(
          (activity) =>
            activity.type === "interaction" || activity.type === "post"
        );
      case "popular":
        return activities.filter((activity) => activity.likes > 20);
      case "recent":
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return activities.filter(
          (activity) => new Date(activity.timestamp) > oneDayAgo
        );
      default:
        return activities;
    }
  }

  // Format timestamp
  formatTimestamp(dateTime) {
    const date = new Date(dateTime);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  }

  // Get status color
  getStatusColor(status) {
    const statusMap = {
      PLANIFIE: "bg-blue-100 text-blue-800",
      EN_COURS: "bg-green-100 text-green-800",
      TERMINE: "bg-gray-100 text-gray-800",
      ANNULE: "bg-red-100 text-red-800",
      default: "bg-gray-100 text-gray-800",
    };
    return statusMap[status] || statusMap.default;
  }

  // Get status label
  getStatusLabel(status) {
    const statusMap = {
      PLANIFIE: "Scheduled",
      EN_COURS: "Live",
      TERMINE: "Completed",
      ANNULE: "Cancelled",
      default: "Scheduled",
    };
    return statusMap[status] || statusMap.default;
  }
}

export const activityFeedService = new ActivityFeedService();
 