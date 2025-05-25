import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with common configuration
const rejectionClassApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to handle different content types and authentication
rejectionClassApi.interceptors.request.use((config) => {
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
rejectionClassApi.interceptors.response.use(
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

class RejectionServiceClass {
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

  // ============ Class Rejection Motif Management ============
  async getAllClassRejectionMotifs() {
    try {
      const response = await rejectionClassApi.get("/motifsRejetClasses");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createClassRejectionMotif(motifData) {
    try {
      const response = await rejectionClassApi.post(
        "/motifsRejetClasses",
        motifData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteClassRejectionMotif(id) {
    try {
      await rejectionClassApi.delete(`/motifsRejetClasses/${id}`);
      return {
        success: true,
        message: "Class rejection motif deleted successfully",
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getClassRejectionMotifByCode(code) {
    try {
      const response = await rejectionClassApi.get(
        `/motifsRejetClasses/code/${code}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Class Rejection Operations ============
  async rejectClass(classId, { codeErreur, motifSupplementaire = "" }) {
    try {
      const response = await rejectionClassApi.post(
        `/classes/${classId}/rejet`,
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

  async getRejectedClasses(page = 1, limit = 10) {
    try {
      const response = await rejectionClassApi.get("/classes/rejetees", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateClass(classId) {
    try {
      const response = await rejectionClassApi.post(
        `/classes/${classId}/validate`,
        null // No body
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const rejectionServiceClass = new RejectionServiceClass();
