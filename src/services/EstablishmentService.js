// services/EstablishmentService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat/etablissements";
const USER_API_BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with interceptor to handle dynamic token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create user API instance for fetching users
const userApi = axios.create({
  baseURL: USER_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include fresh token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request interceptor for user API
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired, redirect to login or refresh token
      localStorage.removeItem("authToken");
      // You might want to redirect to login page here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class EstablishmentService {
  /**
   * Create a new establishment
   * @param {Object} establishment - Establishment data
   * @param {string} establishment.nom - Name of the establishment
   * @param {string} establishment.localisation - Location
   * @param {string} establishment.pays - Country
   * @param {string} establishment.email - Email address
   * @param {string} establishment.telephone - Phone number
   * @param {boolean} establishment.optionEnvoiMailVersClasse - Email to class option
   * @param {boolean} establishment.optionTokenGeneral - General token option
   * @param {boolean} establishment.codeUnique - Unique code option
   * @param {Object} establishment.gestionnaire - Manager/User object with id
   * @returns {Promise<Object>} Created establishment data
   */
  async createEstablishment(establishment) {
    try {
      const response = await api.post("", establishment);
      return response.data;
    } catch (error) {
      console.error("Error creating establishment:", error);
      this.handleError(error, "Failed to create establishment");
      throw error;
    }
  }

  /**
   * Update an existing establishment
   * @param {string} establishmentId - ID of the establishment
   * @param {Object} establishmentData - Updated establishment data
   * @returns {Promise<Object>} Updated establishment data
   */
  async updateEstablishment(establishmentId, establishmentData) {
    try {
      const response = await api.put(`/${establishmentId}`, establishmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating establishment ${establishmentId}:`, error);
      this.handleError(error, "Failed to update establishment");
      throw error;
    }
  }

  /**
   * Delete an establishment
   * @param {string} establishmentId - ID of the establishment
   * @returns {Promise<void>}
   */
  async deleteEstablishment(establishmentId) {
    try {
      await api.delete(`/${establishmentId}`);
    } catch (error) {
      console.error(`Error deleting establishment ${establishmentId}:`, error);
      this.handleError(error, "Failed to delete establishment");
      throw error;
    }
  }

  /**
   * Get all establishments
   * @returns {Promise<Array>} List of establishments
   */
  async getAllEstablishments() {
    try {
      const response = await api.get("");
      return response.data;
    } catch (error) {
      console.error("Error fetching establishments:", error);
      this.handleError(error, "Failed to fetch establishments");
      throw error;
    }
  }

  /**
   * Get establishment by ID
   * @param {string} establishmentId - ID of the establishment
   * @returns {Promise<Object>} Establishment data
   */
  async getEstablishmentById(establishmentId) {
    try {
      const response = await api.get(`/${establishmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching establishment ${establishmentId}:`, error);
      this.handleError(error, "Failed to fetch establishment");
      throw error;
    }
  }

  /**
   * Get gestionnaire of an establishment
   * @param {string} establishmentId - ID of the establishment
   * @returns {Promise<Object>} Gestionnaire data
   */
  async getEstablishmentGestionnaire(establishmentId) {
    try {
      const response = await api.get(`/${establishmentId}/gestionnaire`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gestionnaire for establishment ${establishmentId}:`, error);
      this.handleError(error, "Failed to fetch establishment gestionnaire");
      throw error;
    }
  }

  /**
   * Get all users for gestionnaire dropdown
   * @returns {Promise<Array>} List of users
   */
  async getAllUsers() {
    try {
      const response = await userApi.get("/utilisateurs");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      this.handleError(error, "Failed to fetch users");
      throw error;
    }
  }

  /**
   * Get establishment options (like optionEnvoiMailVersClasse, optionTokenGeneral)
   * @param {string} establishmentId - ID of the establishment
   * @returns {Promise<Object>} Establishment options
   */
  async getEstablishmentOptions(establishmentId) {
    try {
      const establishment = await this.getEstablishmentById(establishmentId);
      return {
        optionEnvoiMailVersClasse: establishment.optionEnvoiMailVersClasse,
        optionTokenGeneral: establishment.optionTokenGeneral,
        codeUnique: establishment.codeUnique,
      };
    } catch (error) {
      console.error(
        `Error fetching options for establishment ${establishmentId}:`,
        error
      );
      this.handleError(error, "Failed to fetch establishment options");
      throw error;
    }
  }

  /**
   * Update establishment options
   * @param {string} establishmentId - ID of the establishment
   * @param {Object} options - Options to update
   * @param {boolean} options.optionEnvoiMailVersClasse - Email to class option
   * @param {boolean} options.optionTokenGeneral - General token option
   * @param {boolean} options.codeUnique - Unique code option
   * @returns {Promise<Object>} Updated establishment data
   */
  async updateEstablishmentOptions(establishmentId, options) {
    try {
      const currentEstablishment = await this.getEstablishmentById(
        establishmentId
      );
      const updatedEstablishment = {
        ...currentEstablishment,
        ...options,
      };
      return await this.updateEstablishment(
        establishmentId,
        updatedEstablishment
      );
    } catch (error) {
      console.error(
        `Error updating options for establishment ${establishmentId}:`,
        error
      );
      this.handleError(error, "Failed to update establishment options");
      throw error;
    }
  }

  /**
   * Search establishments by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Filtered establishments
   */
  async searchEstablishments(searchTerm) {
    try {
      const establishments = await this.getAllEstablishments();
      return establishments.filter((establishment) =>
        establishment.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching establishments:", error);
      this.handleError(error, "Failed to search establishments");
      throw error;
    }
  }

  /**
   * Validate establishment data
   * @param {Object} establishment - Establishment data to validate
   * @returns {Object} Validation result
   */
  validateEstablishment(establishment) {
    const errors = [];

    if (!establishment.nom || establishment.nom.trim() === "") {
      errors.push("Name is required");
    }

    if (establishment.email && !this.isValidEmail(establishment.email)) {
      errors.push("Invalid email format");
    }

    if (
      establishment.telephone &&
      !this.isValidPhone(establishment.telephone)
    ) {
      errors.push("Invalid phone number format. Use international format");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid phone
   */
  isValidPhone(phone) {
    if (!phone) return false;
    
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    
    // Check for common international formats
    const patterns = [
      /^\+237[62]\d{7}$/, // Cameroon: +237 followed by 6 or 2 and 7 digits
      /^\+33[1-9]\d{8}$/, // France: +33 followed by 1-9 and 8 digits
      /^\+1\d{10}$/, // US/Canada: +1 followed by 10 digits
      /^\+234[789]\d{9}$/, // Nigeria: +234 followed by 7,8,9 and 9 digits
      /^\+\d{10,15}$/ // Generic international format
    ];
    
    return patterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   */
  handleError(error, defaultMessage) {
    let errorMessage = defaultMessage;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorMessage = "Invalid data provided";
          break;
        case 401:
          errorMessage = "Authentication required";
          break;
        case 403:
          errorMessage = "Access denied";
          break;
        case 404:
          errorMessage = "Establishment not found";
          break;
        case 409:
          errorMessage = "Establishment already exists";
          break;
        case 500:
          errorMessage = "Server error occurred";
          break;
        default:
          errorMessage = data?.message || defaultMessage;
      }
    } else if (error.request) {
      // Network error
      errorMessage = "Network error - please check your connection";
    }

    // You can customize error handling here (show notifications, etc.)
    console.error("EstablishmentService Error:", errorMessage);
  }

  /**
   * Get API base URL
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    return API_BASE_URL;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem("authToken");
  }
}

const establishmentService = new EstablishmentService();
export default establishmentService;
