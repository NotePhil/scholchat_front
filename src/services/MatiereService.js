import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const matiereApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

matiereApi.interceptors.request.use(
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

class MatiereService {
  /**
   * Gets all subjects
   * @returns {Promise<Array>} List of subjects
   */
  async getAllMatieres() {
    try {
      const response = await matiereApi.get("/matieres");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Creates a new subject
   * @param {Object} matiereData - Subject data
   * @returns {Promise<Object>} Created subject
   */
  async createMatiere(matiereData) {
    try {
      if (!matiereData.nom) {
        throw new Error("Subject name is required");
      }
      const response = await matiereApi.post("/matieres", matiereData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets a subject by name
   * @param {String} nom - Subject name
   * @returns {Promise<Object>} Subject details
   */
  async getMatiereByName(nom) {
    try {
      if (!nom) {
        throw new Error("Subject name is required");
      }
      const response = await matiereApi.get(`/matieres/${nom}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Error handler
   * @param {Error} error - The error object
   */
  handleError(error) {
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

export const matiereService = new MatiereService();
