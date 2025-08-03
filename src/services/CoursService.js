import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const coursApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

coursApi.interceptors.request.use(
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

class CoursService {
  /**
   * Creates a new course
   * @param {Object} coursData - Course data including:
   *   - titre: String (required)
   *   - description: String
   *   - contenu: String (required)
   *   - redacteurId: String (required) - Professor ID
   *   - matiereIds: Array<String> (required) - Array of subject IDs
   *   - classeId: String (optional) - Class ID if course is for specific class
   *   - etat: String (optional) - Defaults to "BROUILLON"
   * @returns {Promise<Object>} Created course
   */
  async createCours(coursData) {
    try {
      // Validate required fields
      if (
        !coursData.titre ||
        !coursData.contenu ||
        !coursData.redacteurId ||
        !coursData.matiereIds
      ) {
        throw new Error(
          "Missing required fields: titre, contenu, redacteurId, or matiereIds"
        );
      }

      // Set default state if not provided
      if (!coursData.etat) {
        coursData.etat = "BROUILLON";
      }

      const response = await coursApi.post("/cours", coursData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets courses by professor ID
   * @param {String} professeurId - Professor ID
   * @returns {Promise<Array>} List of courses
   */
  async getCoursByProfesseur(professeurId) {
    try {
      if (!professeurId) {
        throw new Error("Professor ID is required");
      }
      const response = await coursApi.get(`/cours/professeur/${professeurId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets courses by subject ID
   * @param {String} matiereId - Subject ID
   * @returns {Promise<Array>} List of courses
   */
  async getCoursByMatiere(matiereId) {
    try {
      if (!matiereId) {
        throw new Error("Subject ID is required");
      }
      const response = await coursApi.get(`/cours/matiere/${matiereId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets courses by state
   * @param {String} etat - Course state (BROUILLON, PUBLIE, ARCHIVE, EN_ATTENTE_VALIDATION)
   * @returns {Promise<Array>} List of courses
   */
  async getCoursByEtat(etat) {
    try {
      if (!etat) {
        throw new Error("State is required");
      }
      const response = await coursApi.get(`/cours/etat/${etat}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets a course by ID
   * @param {String} coursId - Course ID
   * @returns {Promise<Object>} Course details
   */
  async getCoursById(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      const response = await coursApi.get(`/cours/${coursId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Updates a course
   * @param {String} coursId - Course ID
   * @param {Object} updates - Course updates
   * @returns {Promise<Object>} Updated course
   */
  async updateCours(coursId, updates) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      const response = await coursApi.put(`/cours/${coursId}`, updates);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Deletes a course
   * @param {String} coursId - Course ID
   * @returns {Promise<void>}
   */
  async deleteCours(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      await coursApi.delete(`/cours/${coursId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Changes course state
   * @param {String} coursId - Course ID
   * @param {String} newState - New state (BROUILLON, PUBLIE, ARCHIVE, EN_ATTENTE_VALIDATION)
   * @returns {Promise<Object>} Updated course
   */
  async changeCoursState(coursId, newState) {
    try {
      if (!coursId || !newState) {
        throw new Error("Course ID and new state are required");
      }
      const response = await coursApi.patch(`/cours/${coursId}/state`, {
        etat: newState,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets courses for a specific class
   * @param {String} classeId - Class ID
   * @returns {Promise<Array>} List of courses
   */
  async getCoursByClasse(classeId) {
    try {
      if (!classeId) {
        throw new Error("Class ID is required");
      }
      const response = await coursApi.get(`/cours/classe/${classeId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets courses for a professor in a specific class
   * @param {String} professeurId - Professor ID
   * @param {String} classeId - Class ID
   * @returns {Promise<Array>} List of courses
   */
  async getCoursByProfesseurAndClasse(professeurId, classeId) {
    try {
      if (!professeurId || !classeId) {
        throw new Error("Professor ID and Class ID are required");
      }
      const response = await coursApi.get(
        `/cours/professeur/${professeurId}/classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Schedules a course (creates a scheduled course instance)
   * @param {String} coursId - Course ID
   * @param {Object} scheduleData - Scheduling data including:
   *   - dateCoursPrevue: Date (required)
   *   - classeId: String (required)
   *   - duree: Number (optional, in minutes)
   * @returns {Promise<Object>} Scheduled course
   */
  async scheduleCours(coursId, scheduleData) {
    try {
      if (!coursId || !scheduleData.dateCoursPrevue || !scheduleData.classeId) {
        throw new Error("Course ID, scheduled date, and class ID are required");
      }
      const response = await coursApi.post(
        `/cours/${coursId}/schedule`,
        scheduleData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets scheduled courses for a class
   * @param {String} classeId - Class ID
   * @returns {Promise<Array>} List of scheduled courses
   */
  async getScheduledCoursByClasse(classeId) {
    try {
      if (!classeId) {
        throw new Error("Class ID is required");
      }
      const response = await coursApi.get(
        `/cours/scheduled/classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Updates a scheduled course
   * @param {String} scheduledCoursId - Scheduled course ID
   * @param {Object} updates - Updates including:
   *   - dateCoursPrevue: Date
   *   - dateDebutEffectif: Date
   *   - dateFinEffectif: Date
   *   - etat: String
   * @returns {Promise<Object>} Updated scheduled course
   */
  async updateScheduledCours(scheduledCoursId, updates) {
    try {
      if (!scheduledCoursId) {
        throw new Error("Scheduled course ID is required");
      }
      const response = await coursApi.put(
        `/cours/scheduled/${scheduledCoursId}`,
        updates
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Records attendance for a scheduled course
   * @param {String} scheduledCoursId - Scheduled course ID
   * @param {Array<String>} presentStudentIds - Array of student IDs who attended
   * @returns {Promise<Object>} Attendance record
   */
  async recordAttendance(scheduledCoursId, presentStudentIds) {
    try {
      if (!scheduledCoursId || !presentStudentIds) {
        throw new Error(
          "Scheduled course ID and present student IDs are required"
        );
      }
      const response = await coursApi.post(
        `/cours/scheduled/${scheduledCoursId}/attendance`,
        {
          presentStudentIds,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets attendance for a scheduled course
   * @param {String} scheduledCoursId - Scheduled course ID
   * @returns {Promise<Object>} Attendance record
   */
  async getAttendance(scheduledCoursId) {
    try {
      if (!scheduledCoursId) {
        throw new Error("Scheduled course ID is required");
      }
      const response = await coursApi.get(
        `/cours/scheduled/${scheduledCoursId}/attendance`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Adds materials to a course
   * @param {String} coursId - Course ID
   * @param {Array<File>} files - Array of files to upload
   * @returns {Promise<Object>} Updated course with materials
   */
  async addCourseMaterials(coursId, files) {
    try {
      if (!coursId || !files || files.length === 0) {
        throw new Error("Course ID and files are required");
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await coursApi.post(
        `/cours/${coursId}/materials`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Gets course materials
   * @param {String} coursId - Course ID
   * @returns {Promise<Array>} List of course materials
   */
  async getCourseMaterials(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      const response = await coursApi.get(`/cours/${coursId}/materials`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Removes a material from a course
   * @param {String} coursId - Course ID
   * @param {String} materialId - Material ID
   * @returns {Promise<void>}
   */
  async removeCourseMaterial(coursId, materialId) {
    try {
      if (!coursId || !materialId) {
        throw new Error("Course ID and material ID are required");
      }
      await coursApi.delete(`/cours/${coursId}/materials/${materialId}`);
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

export const coursService = new CoursService();
