// services/EstablishmentService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat/etablissements";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  },
});

class EstablishmentService {
  /**
   * Get all establishments
   * @returns {Promise} List of establishments
   */
  async getAllEstablishments() {
    try {
      const response = await api.get("");
      return response.data;
    } catch (error) {
      console.error("Error fetching establishments:", error);
      throw error;
    }
  }

  /**
   * Get establishment by ID
   * @param {String} establishmentId - ID of the establishment
   * @returns {Promise} Establishment data
   */
  async getEstablishmentById(establishmentId) {
    try {
      const response = await api.get(`/${establishmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching establishment ${establishmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get establishment options (like optionEnvoiMailNewClasse, optionTokenGeneral)
   * @param {String} establishmentId - ID of the establishment
   * @returns {Promise} Establishment options
   */
  async getEstablishmentOptions(establishmentId) {
    try {
      const response = await api.get(`/${establishmentId}/options`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching options for establishment ${establishmentId}:`,
        error
      );
      throw error;
    }
  }
}

const establishmentService = new EstablishmentService();
export default establishmentService;
