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
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");
    
    console.log("MatiereService - Token found:", !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("MatiereService - Request config:", {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    console.error("MatiereService - Request interceptor error:", error);
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
      console.log("MatiereService - Calling getAllMatieres");
      const response = await matiereApi.get("/matieres");
      console.log("MatiereService - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("MatiereService - Error in getAllMatieres:", error);
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
      
      // Ensure required fields are set
      const completeData = {
        ...matiereData,
        dateCreation: new Date().toISOString(),
        etat: "ACTIF" // Default state
      };
      
      const response = await matiereApi.post("/matieres", completeData);
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
   * Updates a subject
   * @param {String} id - Subject ID
   * @param {Object} matiereData - Updated subject data
   * @returns {Promise<Object>} Updated subject
   */
  async updateMatiere(id, matiereData) {
    try {
      if (!id) {
        throw new Error("Subject ID is required");
      }
      const response = await matiereApi.put(`/matieres/${id}`, matiereData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Deletes a subject
   * @param {String} id - Subject ID
   * @returns {Promise<void>}
   */
  async deleteMatiere(id) {
    try {
      if (!id) {
        throw new Error("Subject ID is required");
      }
      await matiereApi.delete(`/matieres/${id}`);
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
