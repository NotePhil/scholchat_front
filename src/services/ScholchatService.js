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
  if (config.data instanceof FormData) {
    // Let browser set the boundary for multipart/form-data
    delete config.headers["Content-Type"];
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

    const appendToFormData = (key, value) => {
      if (value === null || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && !(item instanceof File)) {
            appendToFormData(`${key}[${index}]`, item);
          } else {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          appendToFormData(`${key}.${subKey}`, subValue);
        });
      } else {
        formData.append(key, value.toString());
      }
    };

    Object.entries(data).forEach(([key, value]) => {
      appendToFormData(key, value);
    });

    return formData;
  }

  async processFileUpload(file) {
    if (!file) return null;
    if (!(file instanceof File)) return file;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    return file;
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
      // Extract base64 data and ensure proper JSON structure
      const payload = {
        nom: professorData.nom?.trim(),
        prenom: professorData.prenom?.trim(),
        email: professorData.email?.trim(),
        telephone: professorData.telephone?.trim(),
        adresse: professorData.adresse?.trim(),
        etat: professorData.etat || "active",
        nomEtablissement: professorData.nomEtablissement?.trim(),
        matriculeProfesseur: professorData.matriculeProfesseur?.trim(),
        nomClasse: professorData.nomClasse?.trim() || "",
      };

      // Handle CNI URLs - convert URL to base64 if needed
      if (professorData.cniUrlRecto) {
        if (professorData.cniUrlRecto.startsWith("http")) {
          try {
            const response = await fetch(professorData.cniUrlRecto);
            const blob = await response.blob();
            payload.cniUrlRecto = await this.processFileUpload(blob);
          } catch (error) {
            console.error("Error fetching CNI front image:", error);
            throw new Error("Failed to process CNI front image");
          }
        } else {
          // If it's already base64, validate and process
          payload.cniUrlRecto = professorData.cniUrlRecto;
        }
      }

      if (professorData.cniUrlVerso) {
        if (professorData.cniUrlVerso.startsWith("http")) {
          try {
            const response = await fetch(professorData.cniUrlVerso);
            const blob = await response.blob();
            payload.cniUrlVerso = await this.processFileUpload(blob);
          } catch (error) {
            console.error("Error fetching CNI back image:", error);
            throw new Error("Failed to process CNI back image");
          }
        } else {
          payload.cniUrlVerso = professorData.cniUrlVerso;
        }
      }

      // Split base64 data if present
      if (payload.cniUrlRecto?.includes("base64,")) {
        payload.cniUrlRecto = payload.cniUrlRecto.split(",")[1];
      }
      if (payload.cniUrlVerso?.includes("base64,")) {
        payload.cniUrlVerso = payload.cniUrlVerso.split(",")[1];
      }

      const response = await api.post("/professeurs", payload);
      return response.data;
    } catch (error) {
      if (
        error.response?.data?.message?.includes("Value too long for column")
      ) {
        throw new Error(
          "Image file size is too large. Please use a smaller image or compress it further."
        );
      }
      this.handleError(error);
    }
  }

  async updateProfessor(id, professorData) {
    try {
      // Process and validate image files if present
      if (professorData.cniUrlRecto) {
        professorData.cniUrlRecto = await this.processFileUpload(
          professorData.cniUrlRecto
        );
      }
      if (professorData.cniUrlVerso) {
        professorData.cniUrlVerso = await this.processFileUpload(
          professorData.cniUrlVerso
        );
      }

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
      // Process and validate image files
      const cniFront = await this.processFileUpload(tutorData.cniUrlFront);
      const cniBack = await this.processFileUpload(tutorData.cniUrlBack);
      const fullPic = await this.processFileUpload(tutorData.fullPicUrl);

      const formData = this.createFormDataFromObject({
        ...this.createBaseUserPayload(tutorData),
        cniUrlFront: cniFront,
        cniUrlBack: cniBack,
        fullPicUrl: fullPic,
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
      // Process and validate image files if present
      if (tutorData.cniUrlFront) {
        tutorData.cniUrlFront = await this.processFileUpload(
          tutorData.cniUrlFront
        );
      }
      if (tutorData.cniUrlBack) {
        tutorData.cniUrlBack = await this.processFileUpload(
          tutorData.cniUrlBack
        );
      }
      if (tutorData.fullPicUrl) {
        tutorData.fullPicUrl = await this.processFileUpload(
          tutorData.fullPicUrl
        );
      }

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
