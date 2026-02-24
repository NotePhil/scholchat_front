import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const gestionnaireService = {
  getAllGestionnaires: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gestionnaires`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gestionnaires:', error);
      throw error;
    }
  },

  getGestionnaireById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gestionnaires/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gestionnaire ${id}:`, error);
      throw error;
    }
  }
};

export default gestionnaireService;
