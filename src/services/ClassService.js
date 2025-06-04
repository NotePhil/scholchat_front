// services/ClassService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat/classes";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error("Unauthorized - Please login again");
          // Redirect to login or refresh token
          break;
        case 403:
          console.error("Forbidden - You don't have permission");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error");
          break;
        default:
          console.error("Unexpected error occurred");
      }
    }
    return Promise.reject(error);
  }
);

class ClassService {
  // ============ Class CRUD Operations ============

  /**
   * Create a new class
   * @param {Object} classData - Class data to create
   * @returns {Promise} Created class data
   */
  async createClass(classData) {
    try {
      const response = await api.post("", classData);
      return response.data;
    } catch (error) {
      console.error("Error creating class:", error);
      throw error;
    }
  }

  /**
   * Get all classes based on filters
   * @param {Object} filters - Filters for classes (status, establishmentId, etc.)
   * @returns {Promise} List of classes
   */
  async getAllClasses(filters = {}) {
    try {
      const response = await api.get("", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching classes:", error);
      throw error;
    }
  }

  /**
   * Get class by ID
   * @param {String} classId - ID of the class
   * @returns {Promise} Class data
   */
  async getClassById(classId) {
    try {
      const response = await api.get(`/${classId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Update class information
   * @param {String} classId - ID of the class to update
   * @param {Object} updateData - Data to update
   * @returns {Promise} Updated class data
   */
  async updateClass(classId, updateData) {
    try {
      const response = await api.put(`/${classId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a class
   * @param {String} classId - ID of the class to delete
   * @returns {Promise} Deletion result
   */
  async deleteClass(classId) {
    try {
      await api.delete(`/${classId}`);
      return { success: true, message: "Class deleted successfully" };
    } catch (error) {
      console.error(`Error deleting class ${classId}:`, error);
      throw error;
    }
  }

  // ============ Class Status Management ============

  /**
   * Approve a pending class
   * @param {String} classId - ID of the class to approve
   * @returns {Promise} Approval result
   */
  async approveClass(classId) {
    try {
      const response = await api.post(`/${classId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Reject a pending class
   * @param {String} classId - ID of the class to reject
   * @param {Object} rejectionData - Rejection reason and comment
   * @returns {Promise} Rejection result
   */
  async rejectClass(classId, rejectionData) {
    try {
      const response = await api.post(`/${classId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Activate an inactive class
   * @param {String} classId - ID of the class to activate
   * @returns {Promise} Activation result
   */
  async activateClass(classId) {
    try {
      const response = await api.post(`/${classId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Error activating class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate an active class
   * @param {String} classId - ID of the class to deactivate
   * @param {Object} deactivationData - Deactivation reason and comment
   * @returns {Promise} Deactivation result
   */
  async deactivateClass(classId, deactivationData) {
    try {
      const response = await api.post(
        `/${classId}/deactivate`,
        deactivationData
      );
      return response.data;
    } catch (error) {
      console.error(`Error deactivating class ${classId}:`, error);
      throw error;
    }
  }

  // ============ Class Access Management ============

  /**
   * Request access to a class using token
   * @param {String} token - Access token for the class
   * @param {String} role - Role of the requester (student/parent)
   * @returns {Promise} Access request result
   */
  async requestClassAccess(token, role) {
    try {
      const response = await api.post("/access/request", { token, role });
      return response.data;
    } catch (error) {
      console.error("Error requesting class access:", error);
      throw error;
    }
  }

  /**
   * Get class by access token
   * @param {String} token - Access token for the class
   * @returns {Promise} Class information
   */
  async getClassByToken(token) {
    try {
      const response = await api.get(`/token/${token}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching class by token:", error);
      throw error;
    }
  }

  /**
   * Approve student/parent access to class
   * @param {String} classId - ID of the class
   * @param {String} userId - ID of the user to approve
   * @returns {Promise} Approval result
   */
  async approveClassAccess(classId, userId) {
    try {
      const response = await api.post(`/${classId}/access/approve/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error approving access for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Reject student/parent access to class
   * @param {String} classId - ID of the class
   * @param {String} userId - ID of the user to reject
   * @param {String} reason - Reason for rejection
   * @returns {Promise} Rejection result
   */
  async rejectClassAccess(classId, userId, reason) {
    try {
      const response = await api.post(`/${classId}/access/reject/${userId}`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting access for user ${userId}:`, error);
      throw error;
    }
  }

  // ============ Class Members Management ============

  /**
   * Add students to class
   * @param {String} classId - ID of the class
   * @param {Array} studentIds - Array of student IDs to add
   * @returns {Promise} Addition result
   */
  async addStudentsToClass(classId, studentIds) {
    try {
      const response = await api.post(`/${classId}/students`, { studentIds });
      return response.data;
    } catch (error) {
      console.error(`Error adding students to class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Remove students from class
   * @param {String} classId - ID of the class
   * @param {Array} studentIds - Array of student IDs to remove
   * @returns {Promise} Removal result
   */
  async removeStudentsFromClass(classId, studentIds) {
    try {
      const response = await api.delete(`/${classId}/students`, {
        data: { studentIds },
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing students from class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Add parents to class
   * @param {String} classId - ID of the class
   * @param {Array} parentIds - Array of parent IDs to add
   * @returns {Promise} Addition result
   */
  async addParentsToClass(classId, parentIds) {
    try {
      const response = await api.post(`/${classId}/parents`, { parentIds });
      return response.data;
    } catch (error) {
      console.error(`Error adding parents to class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Remove parents from class
   * @param {String} classId - ID of the class
   * @param {Array} parentIds - Array of parent IDs to remove
   * @returns {Promise} Removal result
   */
  async removeParentsFromClass(classId, parentIds) {
    try {
      const response = await api.delete(`/${classId}/parents`, {
        data: { parentIds },
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing parents from class ${classId}:`, error);
      throw error;
    }
  }

  // ============ Class History ============

  /**
   * Get activation history for a class
   * @param {String} classId - ID of the class
   * @returns {Promise} Activation history
   */
  async getClassActivationHistory(classId) {
    try {
      const response = await api.get(`/${classId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for class ${classId}:`, error);
      throw error;
    }
  }

  // ============ Establishment Related ============

  /**
   * Get classes by establishment
   * @param {String} establishmentId - ID of the establishment
   * @param {Object} filters - Additional filters
   * @returns {Promise} List of classes
   */
  async getClassesByEstablishment(establishmentId, filters = {}) {
    try {
      const response = await api.get(`/establishment/${establishmentId}`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching classes for establishment ${establishmentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get pending classes for establishment approval
   * @param {String} establishmentId - ID of the establishment
   * @returns {Promise} List of pending classes
   */
  async getPendingClassesForEstablishment(establishmentId) {
    try {
      const response = await api.get(
        `/establishment/${establishmentId}/pending`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching pending classes for establishment ${establishmentId}:`,
        error
      );
      throw error;
    }
  }
}

const classService = new ClassService();
export default classService;
