import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with common configuration
const rejectionApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to handle different content types and authentication
rejectionApi.interceptors.request.use((config) => {
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

// Response interceptor to handle common errors
rejectionApi.interceptors.response.use(
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

class RejectionService {
  // ============ Error Handler ============
  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "Server error occurred";
      console.error("Server Error:", errorMessage);
      throw new Error(errorMessage);
    } else if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error("Network error occurred. Please check your connection.");
    } else {
      console.error("Request Error:", error.message);
      throw new Error("Error setting up request");
    }
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

  // ============ Motif Management ============
  async getAllMotifs() {
    try {
      const response = await rejectionApi.get("/motifsRejets");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMotifById(id) {
    try {
      const response = await rejectionApi.get(`/motifsRejets/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createMotif(motifData) {
    try {
      const response = await rejectionApi.post("/motifsRejets", motifData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMotif(id, motifData) {
    try {
      const response = await rejectionApi.put(`/motifsRejets/${id}`, motifData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMotif(id) {
    try {
      await rejectionApi.delete(`/motifsRejets/${id}`);
      return { success: true, message: "Motif deleted successfully" };
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Professor Management ============
  async getPendingProfessors(page = 1, limit = 10) {
    try {
      const response = await rejectionApi.get(
        "/utilisateurs/professeurs/pending",
        {
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateProfessor(professorId) {
    try {
      const response = await rejectionApi.post(
        `/professors/${professorId}/validate`, // Changed path
        null, // No body
        {
          params: {},
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  async rejectProfessor(professorId, { codeErreur, motifSupplementaire = "" }) {
    try {
      const response = await rejectionApi.post(
        `/utilisateurs/professeurs/${professorId}/rejet`,
        null, // No body
        {
          params: {
            codeErreur,
            motifSupplementaire,
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getProfessorDetails(professorId) {
    try {
      const response = await rejectionApi.get(`/professeurs/${professorId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Professor Motif Assignment ============
  async getProfessorMotifs(professorId) {
    try {
      const response = await rejectionApi.get(
        `/professeurs/${professorId}/motifs`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async assignMotifToProfessor(professorId, motifId) {
    try {
      const response = await rejectionApi.post(
        `/professeurs/${professorId}/motifs/${motifId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeMotifFromProfessor(professorId, motifId) {
    try {
      const response = await rejectionApi.delete(
        `/professeurs/${professorId}/motifs/${motifId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ User Management ============
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      const response = await rejectionApi.get("/utilisateurs", {
        params: { page, limit, ...filters },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserById(id) {
    try {
      const response = await rejectionApi.get(`/utilisateurs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData) {
    try {
      const response = await rejectionApi.post("/utilisateurs", userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await rejectionApi.put(`/utilisateurs/${id}`, userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteUser(id) {
    try {
      await rejectionApi.delete(`/utilisateurs/${id}`);
      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Email Related Services ============
  async regenerateActivationEmail(email) {
    try {
      const response = await rejectionApi.post(
        "/utilisateurs/regenerate-activation",
        { email }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const rejectionService = new RejectionService();
