import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with common configuration
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to handle different content types
api.interceptors.request.use((config) => {
  // For FormData, let the browser set the Content-Type to include boundary
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
  } else {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

class ScholchatService {
  // ============ Error Handler ============
  handleError(error) {
    if (error.response) {
      console.error("Server Error:", error.response.data);
      throw new Error(error.response.data.message || "Server error occurred");
    } else if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error("Network error occurred");
    } else {
      console.error("Request Error:", error.message);
      throw new Error("Error setting up request");
    }
  }

  // ============ Helper Methods ============
  createBaseUserPayload(userData) {
    return {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      telephone: userData.telephone,
      passeAccess: userData.passeAccess,
      adresse: userData.adresse,
      etat: userData.etat || "active",
    };
  }

  createFormDataFromObject(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Handle arrays
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        }
        // Handle files
        else if (value instanceof File) {
          formData.append(key, value);
        }
        // Handle objects
        else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        }
        // Handle primitive values
        else {
          formData.append(key, value);
        }
      }
    });
    return formData;
  }

  // ============ User Management ============
  async getAllUsers() {
    try {
      const response = await api.get("/utilisateurs");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserById(id) {
    try {
      const response = await api.get(`/utilisateurs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData) {
    try {
      const payload = this.createBaseUserPayload(userData);
      const response = await api.post("/utilisateurs", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await api.put(`/utilisateurs/${id}`, userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteUser(id) {
    try {
      await api.delete(`/utilisateurs/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Professor Management ============
  async getAllProfessors() {
    try {
      const response = await api.get("/professeurs");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getProfessorById(id) {
    try {
      const response = await api.get(`/professeurs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createProfessor(professorData) {
    try {
      const formData = this.createFormDataFromObject({
        ...this.createBaseUserPayload(professorData),
        cniUrlRecto: professorData.cniUrlRecto,
        cniUrlVerso: professorData.cniUrlVerso,
        nomEtablissement: professorData.nomEtablissement,
        nomClasse: professorData.nomClasse,
        matriculeProfesseur: professorData.matriculeProfesseur,
      });

      const response = await api.post("/professeurs", formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateProfessor(id, professorData) {
    try {
      const formData = this.createFormDataFromObject(professorData);
      const response = await api.put(`/professeurs/${id}`, formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteProfessor(id) {
    try {
      await api.delete(`/professeurs/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Parent Management ============
  async getAllParents() {
    try {
      const response = await api.get("/parents");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getParentById(id) {
    try {
      const response = await api.get(`/parents/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createParent(parentData) {
    try {
      const payload = {
        ...this.createBaseUserPayload(parentData),
        classes: parentData.classes || [],
      };
      const response = await api.post("/parents", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateParent(id, parentData) {
    try {
      const response = await api.put(`/parents/${id}`, parentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteParent(id) {
    try {
      await api.delete(`/parents/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Student Management ============
  async getAllStudents() {
    try {
      const response = await api.get("/profil-eleves");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStudentById(id) {
    try {
      const response = await api.get(`/profil-eleves/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createStudent(studentData) {
    try {
      const payload = {
        ...this.createBaseUserPayload(studentData),
        niveau: studentData.niveau,
        classes: studentData.classes || [],
      };
      const response = await api.post("/profil-eleves", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateStudent(id, studentData) {
    try {
      const response = await api.put(`/profil-eleves/${id}`, studentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteStudent(id) {
    try {
      await api.delete(`/profil-eleves/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Tutor Management ============
  async getAllTutors() {
    try {
      const response = await api.get("/repetiteurs");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTutorById(id) {
    try {
      const response = await api.get(`/repetiteurs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTutor(tutorData) {
    try {
      const formData = this.createFormDataFromObject({
        ...this.createBaseUserPayload(tutorData),
        cniUrlFront: tutorData.cniUrlFront,
        cniUrlBack: tutorData.cniUrlBack,
        fullPicUrl: tutorData.fullPicUrl,
        nomClasse: tutorData.nomClasse,
      });

      const response = await api.post("/repetiteurs", formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateTutor(id, tutorData) {
    try {
      const formData = this.createFormDataFromObject(tutorData);
      const response = await api.put(`/repetiteurs/${id}`, formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteTutor(id) {
    try {
      await api.delete(`/repetiteurs/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Class Management ============
  async getAllClasses() {
    try {
      const response = await api.get("/classes");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getClassById(id) {
    try {
      const response = await api.get(`/classes/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createClass(classData) {
    try {
      const payload = {
        nom: classData.nom,
        niveau: classData.niveau,
        dateCreation: classData.dateCreation || new Date().toISOString(),
        codeActivation: classData.codeActivation,
        etat: classData.etat || "ACTIF",
        etablissement: classData.etablissement,
        parents: classData.parents || [],
        eleves: classData.eleves || [],
      };
      const response = await api.post("/classes", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateClass(id, classData) {
    try {
      const response = await api.put(`/classes/${id}`, classData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteClass(id) {
    try {
      await api.delete(`/classes/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Establishment Management ============
  async getAllEstablishments() {
    try {
      const response = await api.get("/etablissements");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEstablishmentById(id) {
    try {
      const response = await api.get(`/etablissements/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createEstablishment(establishmentData) {
    try {
      const payload = {
        nom: establishmentData.nom,
      };
      const response = await api.post("/etablissements", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateEstablishment(id, establishmentData) {
    try {
      const response = await api.put(
        `/etablissements/${id}`,
        establishmentData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteEstablishment(id) {
    try {
      await api.delete(`/etablissements/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const scholchatService = new ScholchatService();
