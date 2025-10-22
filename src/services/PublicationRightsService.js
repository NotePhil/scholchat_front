import axios from "axios";

class PublicationRightsService {
  constructor(baseUrl = null) {
    this.baseUrl =
      baseUrl ||
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:8486/scholchat";

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("Publication Rights API Error:", error);

        // Handle different types of errors
        if (error.response) {
          const status = error.response.status;
          const message =
            error.response.data?.message ||
            error.response.statusText ||
            `HTTP Error: ${status}`;

          // Handle specific error cases
          switch (status) {
            case 404:
              throw new Error("User or class not found");
            case 403:
              throw new Error("Access denied - insufficient permissions");
            case 409:
              throw new Error(
                "User already has publication rights for this class"
              );
            case 422:
              throw new Error("Only professors can have publication rights");
            default:
              throw new Error(message);
          }
        } else if (error.request) {
          throw new Error("Network error: No response from server");
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Assign publication rights to a user for a class
   * According to your API: POST /droits-publication/{classeId}/{userId}?peutPublier=true&peutModerer=true
   * @param {string} userId - The user ID
   * @param {string} classId - The class ID
   * @param {boolean} peutPublier - Can publish
   * @param {boolean} peutModerer - Can moderate
   * @returns {Promise<Object>} The result of the operation
   */
  async assignPublicationRights(
    userId,
    classId,
    peutPublier = true,
    peutModerer = true
  ) {
    try {
      console.log("Assigning publication rights:", {
        userId,
        classId,
        peutPublier,
        peutModerer,
      });

      // Construct the URL based on your backend API structure
      const url = `/droits-publication/${userId}/${classId}`;

      const response = await this.axiosInstance.post(url, null, {
        params: {
          peutPublier,
          peutModerer,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error assigning publication rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get publication rights for a user in a class
   * @param {string} userId - The user ID
   * @param {string} classId - The class ID
   * @returns {Promise<Object>} The publication rights
   */
  async getPublicationRights(userId, classId) {
    try {
      const response = await this.axiosInstance.get(
        `/droits-publication/${classId}/${userId}`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error getting publication rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update publication rights for a user in a class
   * @param {string} userId - The user ID
   * @param {string} classId - The class ID
   * @param {boolean} peutPublier - Can publish
   * @param {boolean} peutModerer - Can moderate
   * @returns {Promise<Object>} The result of the operation
   */
  async updatePublicationRights(userId, classId, peutPublier, peutModerer) {
    try {
      const response = await this.axiosInstance.put(
        `/droits-publication/${userId}/${classId}`,
        null,
        {
          params: {
            peutPublier,
            peutModerer,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error updating publication rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove publication rights for a user in a class
   * @param {string} userId - The user ID
   * @param {string} classId - The class ID
   * @returns {Promise<Object>} The result of the operation
   */
  async removePublicationRights(userId, classId) {
    try {
      const response = await this.axiosInstance.delete(
        `/droits-publication/${userId}/${classId}`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error removing publication rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all users with publication rights for a class
   * @param {string} classId - The class ID
   * @returns {Promise<Array>} List of users with rights
   */
  async getUsersWithRightsForClass(classId) {
    try {
      const response = await this.axiosInstance.get(
        `/droits-publication/classes/${classId}/utilisateurs`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error getting users with rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all classes where a user has publication rights
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} List of classes with rights
   */
  async getClassesWithRightsForUser(userId) {
    try {
      const response = await this.axiosInstance.get(
        `/droits-publication/utilisateurs/${userId}/classes`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error getting classes with rights:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user has publication rights for a specific class
   * @param {string} userId - The user ID
   * @param {string} classId - The class ID
   * @returns {Promise<Object>} Rights status
   */
  async hasPublicationRights(userId, classId) {
    try {
      const result = await this.getPublicationRights(userId, classId);
      return {
        success: true,
        hasRights: result.success && result.data,
        data: result.data,
      };
    } catch (error) {
      return {
        success: true,
        hasRights: false,
        data: null,
      };
    }
  }

  /**
   * Bulk assign publication rights to multiple users for a class
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string} classId - The class ID
   * @param {boolean} peutPublier - Can publish
   * @param {boolean} peutModerer - Can moderate
   * @returns {Promise<Object>} Results for each user
   */
  async bulkAssignPublicationRights(
    userIds,
    classId,
    peutPublier = true,
    peutModerer = true
  ) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.assignPublicationRights(
          userId,
          classId,
          peutPublier,
          peutModerer
        );
        results.push({
          userId,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  }
}

const publicationRightsService = new PublicationRightsService();
export default publicationRightsService;
