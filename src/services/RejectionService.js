import axios from "axios";
const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with default config
const rejectionApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token injection
rejectionApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Special handling for FormData
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
rejectionApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await rejectionService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return rejectionApi(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";

      switch (error.response.status) {
        case 400:
          console.error("Bad Request:", errorMessage);
          break;
        case 403:
          console.error("Forbidden:", errorMessage);
          break;
        case 404:
          console.error("Not Found:", errorMessage);
          break;
        case 500:
          console.error("Server Error:", errorMessage);
          break;
        default:
          console.error("Error:", errorMessage);
      }
    } else if (error.request) {
      console.error("Network Error:", "No response received");
    } else {
      console.error("Request Error:", error.message);
    }

    return Promise.reject(error);
  }
);

class RejectionService {
  // ============ Authentication & Token Management ============
  async refreshToken() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken: localStorage.getItem("refreshToken"),
      });

      const { token, refreshToken } = response.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);

      return token;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  clearAuthData() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("cmr.notep.business.business.token");
  }

  // ============ Rejection Motifs ============
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
      const response = await rejectionApi.patch(
        `/motifsRejets/${id}`,
        motifData
      );
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
        "/utilisateurs/professors/pending",
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
        `/utilisateurs/professors/${professorId}/validate`
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
        null,
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

  // ============ Error Handling ============
  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "Server error occurred";

      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Network error occurred. Please check your connection.");
    } else {
      throw new Error("Error setting up request: " + error.message);
    }
  }
}

export const rejectionService = new RejectionService();
