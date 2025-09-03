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
        const hasLiked = await this.hasUserLikedEvent(activityId, userId);

        if (hasLiked) {
          // This will remove the like (dislike)
          const interaction = {
            type: "LIKE",
            content: "liked this",
            createdById: userId,
            eventId: activityId,
          };

          await activityFeedApi.post("/interactions", interaction);
          return false; // Return false to indicate removal
        }
      }

      // Create new interaction
      const interaction = {
        type: reactionType.toUpperCase(),
        content: `${reactionType} this`,
        createdById: userId,
        eventId: activityId,
      };

      console.log("Sending interaction:", interaction);
      await activityFeedApi.post("/interactions", interaction);
      return true; // Return true to indicate creation
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
      const interaction = {
        type: "COMMENT",
        content: comment,
        createdById: this.getValidUserId(),
        eventId: activityId,
      };

      console.log("Sending comment interaction:", interaction);
      const response = await activityFeedApi.post("/interactions", interaction);

      const currentUser = this.getCurrentUser();
      return {
        id: response.data.id || Date.now().toString(),
        content: comment,
        user: currentUser,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to comment:", error);
      throw new Error("Failed to post comment");
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
      const eventPayload = {
        ...eventData,
        createurId: this.getValidUserId(),
      };

      console.log("Creating event with payload:", eventPayload);
      const response = await activityFeedApi.post("/evenements", eventPayload);
      return response.data;
    } catch (error) {
      console.error("Failed to create event:", error);
      throw new Error("Failed to create event");
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

    return {
      id: event.id,
      type: "event",
      user: {
        id: event.createurId || currentUser.id,
        name: event.createurNom || "Event Creator",
        role: "professor",
        avatar: "/api/placeholder/48/48",
      },
      timestamp:
        event.heureDebut || event.dateCreation || new Date().toISOString(),
      content: `${event.titre}: ${event.description || "New event created"}`,
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
      likes: event.likesCount || Math.floor(Math.random() * 50),
      comments: event.comments || [],
      shares: event.sharesCount || Math.floor(Math.random() * 20),
      isLiked: false,
      isShared: false,
    };
  }

  // Transform interaction to activity
  transformInteractionToActivity(interaction) {
    const currentUser = this.getCurrentUser();

    return {
      id: interaction.id,
      type: interaction.type === "COMMENT" ? "post" : "interaction",
      user: {
        id: interaction.createdById || currentUser.id,
        name: interaction.createdByName || "User",
        role: interaction.createdByRole || "user",
        avatar: "/api/placeholder/48/48",
      },
      timestamp: interaction.creationDate || new Date().toISOString(),
      content: interaction.content,
      interactionType: interaction.type,
      likes: interaction.likesCount || Math.floor(Math.random() * 30),
      comments: interaction.comments || [],
      shares: interaction.sharesCount || Math.floor(Math.random() * 10),
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
