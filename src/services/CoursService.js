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
  async createCours(coursData) {
    try {
      if (
        !coursData.titre ||
        !coursData.description ||
        !coursData.redacteurId ||
        !coursData.matieres ||
        !coursData.chapitres
      ) {
        throw new Error(
          "Missing required fields: titre, description, redacteurId, matieres, or chapitres"
        );
      }

      if (!coursData.etat) {
        coursData.etat = "BROUILLON";
      }

      if (!coursData.restriction) {
        coursData.restriction = "PRIVE";
      }

      const response = await coursApi.post("/cours", coursData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

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

  async getCoursWithChapitres(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      const response = await coursApi.get(`/cours/${coursId}/complet`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCoursAccessibles(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await coursApi.get(`/cours/accessibles/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCoursByRestriction(restriction) {
    try {
      if (!restriction) {
        throw new Error("Restriction is required");
      }
      const response = await coursApi.get(`/cours/restriction/${restriction}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

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
