import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8486/scholchat';

// Create axios instance with authentication interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const gestionnaireService = {
  getAllGestionnaires: async () => {
    try {
      const response = await api.get('/gestionnaires');
      return response.data;
    } catch (error) {
      console.error('Error fetching gestionnaires:', error);
      throw error;
    }
  },

  getGestionnaireById: async (id) => {
    try {
      const response = await api.get(`/gestionnaires/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gestionnaire ${id}:`, error);
      throw error;
    }
  }
};

export default gestionnaireService;
