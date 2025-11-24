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

// Request interceptor to handle different content types and add authentication token
api.interceptors.request.use((config) => {
  // Add authentication token to all requests
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
      email: userData.email?.toLowerCase(), // Ensure email is lowercase
      telephone: userData.telephone,
      passeAccess: userData.passeAccess,
      adresse: userData.adresse,
      etat: userData.etat || "ACTIVE",
    };
  }

  createFormDataFromObject(data) {
    const formData = new FormData();

    const appendToFormData = (key, value) => {
      if (value === null || value === undefined) return;

      // Convert email fields to lowercase
      if (key === "email" && typeof value === "string") {
        value = value.toLowerCase();
      }

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
          appendToFormData(
            `${key}.${subKey}`,
            subKey === "email" && typeof subValue === "string"
              ? subValue.toLowerCase()
              : subValue
          );
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
      const payload = this.createBaseUserPayload({
        ...userData,
        email: userData.email?.toLowerCase(), // Ensure email is lowercase
      });
      const response = await api.post("/utilisateurs", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id, userData) {
    try {
      // Ensure email is lowercase if provided
      if (userData.email) {
        userData.email = userData.email.toLowerCase();
      }
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
        email: professorData.email?.trim().toLowerCase(), // Ensure email is lowercase
        telephone: professorData.telephone?.trim(),
        adresse: professorData.adresse?.trim(),
        etat: professorData.etat || "ACTIVE",
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
      // Ensure email is lowercase if provided
      if (professorData.email) {
        professorData.email = professorData.email.toLowerCase();
      }

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
      // Ensure the payload matches the expected structure
      const payload = {
        type: "parent",
        nom: parentData.nom?.trim(),
        prenom: parentData.prenom?.trim(),
        email: parentData.email?.trim().toLowerCase(), // Ensure email is lowercase
        telephone: parentData.telephone?.trim(),
        adresse: parentData.adresse?.trim(),
        etat: parentData.etat || "ACTIVE",
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
      // Ensure the payload matches the expected structure
      const payload = {
        type: "parent",
        nom: parentData.nom?.trim(),
        prenom: parentData.prenom?.trim(),
        email: parentData.email?.trim().toLowerCase(), // Ensure email is lowercase
        telephone: parentData.telephone?.trim(),
        adresse: parentData.adresse?.trim(),
        etat: parentData.etat || "ACTIVE",
        classes: parentData.classes || [],
      };

      const response = await api.put(`/parents/${id}`, payload);
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
        type: "eleve",
        nom: studentData.nom?.trim(),
        prenom: studentData.prenom?.trim(),
        email: studentData.email?.trim().toLowerCase(), // Ensure email is lowercase
        telephone: studentData.telephone?.trim(),
        adresse: studentData.adresse?.trim(),
        etat: studentData.etat || "ACTIVE",
        niveau: studentData.niveau?.trim(),
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
      const payload = {
        type: "eleve",
        nom: studentData.nom?.trim(),
        prenom: studentData.prenom?.trim(),
        email: studentData.email?.trim().toLowerCase(), // Ensure email is lowercase
        telephone: studentData.telephone?.trim(),
        adresse: studentData.adresse?.trim(),
        etat: studentData.etat || "ACTIVE",
        niveau: studentData.niveau?.trim(),
        classes: studentData.classes || [],
      };

      const response = await api.put(`/profil-eleves/${id}`, payload);
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
      // Ensure email is lowercase
      if (tutorData.email) {
        tutorData.email = tutorData.email.toLowerCase();
      }

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
      // Ensure email is lowercase if provided
      if (tutorData.email) {
        tutorData.email = tutorData.email.toLowerCase();
      }

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
      // Transform the data to match backend expectations
      const payload = {
        id: crypto.randomUUID(), // Generate UUID for new classes
        nom: classData.nom?.trim(),
        niveau: classData.niveau?.trim(),
        dateCreation: classData.date_creation || new Date().toISOString(),
        codeActivation: classData.code_activation || null,
        etat: classData.etat || "ACTIF",
        etablissement: {
          id: classData.etablissement_id || null,
        },
      };

      const response = await api.post("/classes", payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateClass(id, classData) {
    try {
      // Transform the data to match backend expectations
      const payload = {
        id: id,
        nom: classData.nom?.trim(),
        niveau: classData.niveau?.trim(),
        dateCreation: classData.date_creation,
        codeActivation: classData.code_activation || null,
        etat: classData.etat,
        etablissement: {
          id: classData.etablissement_id || null,
        },
      };

      const response = await api.put(`/classes/${id}`, payload);
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

  // ============ Motif Management ============
  async getAllMotifs() {
    try {
      const response = await api.get("/motifsRejets");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMotifById(id) {
    try {
      const response = await api.get(`/motifsRejets/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createMotif(motifData) {
    try {
      const response = await api.post("/motifsRejets", motifData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMotif(id, motifData) {
    try {
      const response = await api.put(`/motifsRejets/${id}`, motifData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMotif(id) {
    try {
      await api.delete(`/motifsRejets/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Professor Motif Assignment ============
  async getProfessorMotifs(professorId) {
    try {
      const response = await api.get(`/professeurs/${professorId}/motifs`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async assignMotifToProfessor(professorId, motifId) {
    try {
      const response = await api.post(
        `/professeurs/${professorId}/motifs/${motifId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeMotifFromProfessor(professorId, motifId) {
    try {
      const response = await api.delete(
        `/professeurs/${professorId}/motifs/${motifId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ File Upload ============
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Professor Validation/Rejection ============
  async validateProfessor(professorId) {
    try {
      const response = await api.post(
        `/utilisateurs/professeurs/${professorId}/validate`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async rejectProfessor(professorId, rejectionData) {
    try {
      const formData = this.createFormDataFromObject(rejectionData);
      const response = await api.post(
        `/utilisateurs/professeurs/${professorId}/rejet`,
        formData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Pending Professors ============
  async getPendingProfessors() {
    try {
      const response = await api.get("/utilisateurs/professors/pending");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Authentication ============
  async login(credentials) {
    try {
      // Ensure email is lowercase for login
      if (credentials.email) {
        credentials.email = credentials.email.toLowerCase();
      }

      const response = await api.post("/auth/login", credentials);
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout() {
    try {
      const response = await api.post("/auth/logout");
      // Remove token from localStorage
      localStorage.removeItem("authToken");
      return response.data;
    } catch (error) {
      // Still remove token even if server error
      localStorage.removeItem("authToken");
      this.handleError(error);
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem("authToken");
  }

  getToken() {
    return localStorage.getItem("authToken");
  }
  async patchUser(id, partialUpdate) {
    try {
      // Ensure email is lowercase if provided
      if (partialUpdate.email) {
        partialUpdate.email = partialUpdate.email.toLowerCase();
      }

      // Remove any file references since they're already uploaded to S3
      const payload = { ...partialUpdate };
      delete payload.cniUrlRecto;
      delete payload.cniUrlVerso;
      delete payload.selfieUrl;

      const response = await api.patch(`/utilisateurs/${id}`, payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const scholchatService = new ScholchatService();
