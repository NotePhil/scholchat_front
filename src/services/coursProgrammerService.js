import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const coursProgrammerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

coursProgrammerApi.interceptors.request.use(
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

// Add response interceptor for debugging
coursProgrammerApi.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

class CoursProgrammerService {
  async programmerCours(coursProgrammerData) {
    try {
      console.log(
        "🚀 Starting programmerCours with raw data:",
        coursProgrammerData
      );

      // Validate required fields
      if (!coursProgrammerData.coursId) {
        throw new Error("Course ID is required");
      }
      if (!coursProgrammerData.dateCoursPrevue) {
        throw new Error("Scheduled date is required");
      }
      if (!coursProgrammerData.lieu) {
        throw new Error("Location is required");
      }

      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("cmr.notep.business.business.token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Clean and validate the data
      const cleanedData = {
        coursId: coursProgrammerData.coursId?.trim(),
        dateCoursPrevue: coursProgrammerData.dateCoursPrevue,
        lieu: coursProgrammerData.lieu?.trim(),
        description: coursProgrammerData.description?.trim() || null,
        capaciteMax: coursProgrammerData.capaciteMax
          ? parseInt(coursProgrammerData.capaciteMax, 10)
          : null,
        classeId: coursProgrammerData.classeId?.trim() || null,
        participantsIds: [],
      };

      // Clean and validate participantsIds
      if (
        coursProgrammerData.participantsIds &&
        Array.isArray(coursProgrammerData.participantsIds)
      ) {
        cleanedData.participantsIds = coursProgrammerData.participantsIds
          .filter((id) => id && typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim())
          .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
      }

      console.log(
        "🔍 Cleaned data before sending:",
        JSON.stringify(cleanedData, null, 2)
      );
      console.log("📊 Data summary:", {
        coursId: cleanedData.coursId,
        classeId: cleanedData.classeId,
        lieu: cleanedData.lieu,
        participantsCount: cleanedData.participantsIds.length,
        participantsIds: cleanedData.participantsIds,
        capaciteMax: cleanedData.capaciteMax,
        hasDescription: !!cleanedData.description,
      });

      // Validate UUID format for coursId and classeId
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(cleanedData.coursId)) {
        throw new Error(`Invalid course ID format: ${cleanedData.coursId}`);
      }

      if (cleanedData.classeId && !uuidRegex.test(cleanedData.classeId)) {
        throw new Error(`Invalid class ID format: ${cleanedData.classeId}`);
      }

      // Validate participant IDs
      for (const participantId of cleanedData.participantsIds) {
        if (!uuidRegex.test(participantId)) {
          throw new Error(`Invalid participant ID format: ${participantId}`);
        }
      }

      console.log("📤 Sending request to:", `/cours-programmes`);
      console.log("📤 Request payload:", JSON.stringify(cleanedData, null, 2));

      const response = await coursProgrammerApi.post(
        "/cours-programmes",
        cleanedData
      );

      console.log("✅ Course scheduled successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error in programmerCours:", error);

      let errorMessage = "An unexpected error occurred";
      if (error.response) {
        console.error("❌ Response error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });

        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.statusText ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        console.error(
          "❌ Request error - no response received:",
          error.request
        );
        errorMessage = "No response from server. Please check your connection.";
      } else {
        console.error("❌ Request setup error:", error.message);
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  async obtenirProgrammationParCours(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }

      console.log("📥 Fetching programming for course:", coursId);

      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-cours/${coursId}`
      );

      console.log("✅ Fetched programming data:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching programming:", error);
      this.handleError(error);
    }
  }

  async updateScheduledCours(scheduledId, updates) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }

      console.log(
        "🔄 Updating scheduled course:",
        scheduledId,
        "with:",
        updates
      );

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("✅ Updated scheduled course:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating scheduled course:", error);
      this.handleError(error);
    }
  }

  async demarrerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }

      const updates = {
        etatCoursProgramme: "EN_COURS",
        dateDebutCoursEffectif: new Date().toISOString(),
      };

      console.log("▶️ Starting course:", scheduledId, "with updates:", updates);

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("✅ Course started:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error starting course:", error);
      this.handleError(error);
    }
  }

  async terminerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }

      const updates = {
        etatCoursProgramme: "TERMINE",
        dateFinCoursEffectif: new Date().toISOString(),
      };

      console.log("⏹️ Ending course:", scheduledId, "with updates:", updates);

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("✅ Course ended:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error ending course:", error);
      this.handleError(error);
    }
  }

  async annulerCours(scheduledId, reason) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }

      const updates = {
        etatCoursProgramme: "ANNULE",
        raisonAnnulation: reason || "",
      };

      console.log("❌ Canceling course:", scheduledId, "with reason:", reason);

      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );

      console.log("✅ Course canceled:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error canceling course:", error);
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error("🔧 Handling error:", error);

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

export const coursProgrammerService = new CoursProgrammerService();
