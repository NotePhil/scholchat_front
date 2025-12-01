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
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");
    
    console.log("CoursService - Token found:", !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("CoursService - Request config:", {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers.Authorization,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error("CoursService - Request interceptor error:", error);
    return Promise.reject(error);
  }
);

coursApi.interceptors.response.use(
  (response) => {
    console.log("CoursService - Response interceptor:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error("CoursService - Response interceptor error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

class CoursService {
  async createCours(coursData) {
    try {
      console.log("CoursService - createCours called with:", coursData);
      console.log("CoursService - Raw chapitres:", coursData.chapitres);
      console.log("CoursService - Raw matieres:", coursData.matieres);
      
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

      const formattedData = {
        titre: coursData.titre,
        description: coursData.description,
        etat: coursData.etat,
        restriction: coursData.restriction,
        references: coursData.references || "",
        redacteurId: parseInt(coursData.redacteurId),
        matieres: coursData.matieres.map((matiere) => ({
          id: parseInt(matiere.id),
        })),
        chapitres: coursData.chapitres.map((chapitre) => ({
          titre: chapitre.titre,
          description: chapitre.description || "",
          ordre: parseInt(chapitre.ordre),
          contenu: chapitre.contenu,
        })),
      };

      console.log("CoursService - Formatted data:", JSON.stringify(formattedData, null, 2));
      console.log("CoursService - Request headers:", coursApi.defaults.headers);
      console.log("CoursService - Making POST request to /cours");

      alert("Envoi vers API: " + JSON.stringify(formattedData).substring(0, 100));
      const response = await coursApi.post("/cours", formattedData);
      console.log("CoursService - Response received:", response.data);
      alert("Réponse API reçue!");
      return response.data;
    } catch (error) {
      console.error("CoursService - Create course error:", error);
      console.error("CoursService - Error response:", error.response?.data);
      console.error("CoursService - Error status:", error.response?.status);
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

      const formattedData = {
        titre: updates.titre,
        description: updates.description,
        etat: updates.etat || "BROUILLON",
        restriction: updates.restriction,
        references: updates.references || "",
        redacteurId: updates.redacteurId,
        matieres: updates.matieres.map((matiere) => ({
          id: matiere.id,
        })),
        chapitres: updates.chapitres.map((chapitre) => ({
          titre: chapitre.titre,
          description: chapitre.description || "",
          ordre: chapitre.ordre,
          contenu: chapitre.contenu,
        })),
      };

      console.log("Updating course:", JSON.stringify(formattedData, null, 2));

      const response = await coursApi.put(`/cours/${coursId}`, formattedData);
      return response.data;
    } catch (error) {
      console.error("Update course error:", error);
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
    console.error("CoursService - handleError called with:", error);
    
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.details ||
        `HTTP ${error.response.status}: ${error.response.statusText}`;

      console.error("CoursService - API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url,
        method: error.config?.method
      });

      throw new Error(errorMessage);
    } else if (error.request) {
      console.error("CoursService - Network Error:", error.request);
      throw new Error(
        "Network error. Please check your connection and server status."
      );
    } else {
      console.error("CoursService - Request Setup Error:", error.message);
      throw new Error("Request setup error: " + error.message);
    }
  }
}

export const coursService = new CoursService();
