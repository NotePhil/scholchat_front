// services/parentService.js
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class ParentService {
  /**
   * Get all children of a parent
   * @param {string} parentId - Parent's user ID
   * @returns {Promise<Array>} List of children (Eleves)
   */
  async getParentsByProfesseur(professeurId) {
    try {
      const response = await api.get(`/parents/professeur/${professeurId}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching parents for professor:", error);
      return [];
    }
  }

  async getElevesByProfesseur(professeurId) {
    try {
      const response = await api.get(`/profil-eleves/professeur/${professeurId}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching eleves for professor:", error);
      return [];
    }
  }

  async getChildren(parentId) {
    try {
      const response = await api.get(`/parents/${parentId}/enfants`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching parent children:", error);
      return [];
    }
  }

  /**
   * Get parent profile
   * @param {string} parentId - Parent's user ID
   * @returns {Promise<Object>} Parent data
   */
  async getParent(parentId) {
    try {
      const response = await api.get(`/parents/${parentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching parent:", error);
      throw error;
    }
  }

  /**
   * Get accessible classes for a specific child
   * @param {string} childId - Child's user ID
   * @returns {Promise<Array>} List of accessible classes
   */
  async getChildClasses(childId) {
    try {
      const response = await api.get(`/acceder/utilisateurs/${childId}/classes`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching child classes:", error);
      return [];
    }
  }

  /**
   * Get scheduled courses for a specific child (by classes)
   * @param {string} childId - Child's user ID
   * @returns {Promise<Array>} List of scheduled courses
   */
  async getChildCourses(childId) {
    try {
      const response = await api.get(`/cours-programmes/by-participant/${childId}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching child courses:", error);
      return [];
    }
  }

  /**
   * Get courses for a specific class
   * @param {string} classeId - Class ID
   * @returns {Promise<Array>} List of scheduled courses
   */
  async getClassCourses(classeId) {
    try {
      const response = await api.get(`/cours-programmes/by-classe/${classeId}`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching class courses:", error);
      return [];
    }
  }

  /**
   * Get notifications for the current authenticated user (parent)
   * Note: The API returns notifications based on the authenticated user's JWT token
   * @returns {Promise<Array>} List of notifications
   */
  async getMyNotifications() {
    try {
      const response = await api.get("/notifications");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadNotificationCount() {
    try {
      const response = await api.get("/notifications/count");
      return response.data || 0;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return 0;
    }
  }
}

const parentService = new ParentService();
export default parentService;
