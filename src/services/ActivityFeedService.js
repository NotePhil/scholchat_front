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
      // Get the real user ID from localStorage (UUID from auth response)
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const username = localStorage.getItem("username");
      const userRole = localStorage.getItem("userRole");

      // Fallback to decoded token if direct storage not available
      const decodedToken = JSON.parse(
        localStorage.getItem("decodedToken") || "{}"
      );
      const authResponse = JSON.parse(
        localStorage.getItem("authResponse") || "{}"
      );

      return {
        id: userId || authResponse.userId || "unknown", // Use actual UUID
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

    // Validation: Ensure we have a valid UUID, not an email
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

      // Transform events to activities
      const eventActivities = events.map((event) =>
        this.transformEventToActivity(event)
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

      // Return mock data for development
      return this.getMockActivities(filter);
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
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        content: "Physics Lab Session - Quantum Mechanics Experiments",
        eventDetails: {
          title: "Advanced Physics Lab",
          description:
            "Hands-on experiments with quantum mechanics principles. Students will work with interferometry and wave-particle duality demonstrations.",
          location: "Science Building - Lab 204",
          status: "PLANIFIE",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
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
      {
        id: "interaction_1",
        type: "post",
        user: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatar: currentUser.avatar,
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        content:
          "Just finished the machine learning assignment! The neural network architecture was fascinating. Looking forward to implementing it in real projects.",
        likes: 28,
        comments: [
          {
            id: "c2",
            content: "Great work! Which framework did you use?",
            user: {
              id: "student_2",
              name: "Emma Wilson",
              avatar: "/api/placeholder/32/32",
            },
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
        shares: 5,
        isLiked: true,
        isShared: false,
      },
      {
        id: "event_2",
        type: "event",
        user: {
          id: "prof_2",
          name: "Prof. Michael Brown",
          role: "professor",
          avatar: "/api/placeholder/48/48",
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        content: "Annual Science Fair - Registration Open",
        eventDetails: {
          title: "Annual Science Fair 2025",
          description:
            "Present your innovative projects and compete for exciting prizes. Open to all students across all departments.",
          location: "Main Auditorium",
          status: "PLANIFIE",
          startTime: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // next week
          endTime: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000
          ).toISOString(),
          participantsCount: 120,
        },
        media: [
          {
            id: "2",
            fileName: "science-fair-poster.jpg",
            filePath: "/api/placeholder/400/300",
            type: "IMAGE",
          },
          {
            id: "3",
            fileName: "prizes.jpg",
            filePath: "/api/placeholder/400/300",
            type: "IMAGE",
          },
        ],
        likes: 45,
        comments: [],
        shares: 12,
        isLiked: false,
        isShared: false,
      },
      {
        id: "post_1",
        type: "post",
        user: {
          id: "student_3",
          name: "Maya Patel",
          role: "student",
          avatar: "/api/placeholder/48/48",
        },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        content:
          "Study group forming for the upcoming calculus exam! We're meeting at the library every Tuesday and Thursday at 6 PM. All levels welcome!",
        likes: 22,
        comments: [
          {
            id: "c3",
            content:
              "Count me in! I really need help with integration techniques.",
            user: {
              id: "student_4",
              name: "James Rodriguez",
              avatar: "/api/placeholder/32/32",
            },
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "c4",
            content: "Perfect timing! I was looking for a study group.",
            user: {
              id: "student_5",
              name: "Lily Zhang",
              avatar: "/api/placeholder/32/32",
            },
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ],
        shares: 7,
        isLiked: false,
        isShared: false,
      },
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

  // Like an activity
  async likeActivity(activityId) {
    try {
      const interaction = {
        type: "LIKE",
        content: "liked this",
        createdById: this.getValidUserId(), // Use real UUID
        eventId: activityId,
      };

      console.log("Sending like interaction:", interaction);
      await activityFeedApi.post("/interactions", interaction);
      return true;
    } catch (error) {
      console.error("Failed to like activity:", error);
      return false;
    }
  }

  // Comment on activity
  async commentOnActivity(activityId, comment) {
    try {
      const interaction = {
        type: "COMMENT",
        content: comment,
        createdById: this.getValidUserId(), // Use real UUID
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
        createdById: this.getValidUserId(), // Use real UUID
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
        createdById: this.getValidUserId(), // Use real UUID
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
        createurId: this.getValidUserId(), // Use real UUID
      };

      console.log("Creating event with payload:", eventPayload);
      const response = await activityFeedApi.post("/evenements", eventPayload);
      return response.data;
    } catch (error) {
      console.error("Failed to create event:", error);
      throw new Error("Failed to create event");
    }
  }

  // Upload media
  async uploadMedia(file, type = "IMAGE") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // For now, return mock upload response
      return {
        id: Date.now().toString(),
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        filePath: URL.createObjectURL(file),
        bucketName: "events-bucket",
        type: type,
      };
    } catch (error) {
      console.error("Failed to upload media:", error);
      throw new Error("Failed to upload media");
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
