import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const coursProgrammerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

coursProgrammerApi.interceptors.request.use(
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

class CoursProgrammerService {
  async programmerCours(coursProgrammerData) {
    try {
      if (!coursProgrammerData.dateCoursPrevue) {
        throw new Error("Scheduled date (dateCoursPrevue) is required");
      }
      const response = await coursProgrammerApi.post(
        "/cours-programmes",
        coursProgrammerData
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirProgrammationParCours(coursId) {
    try {
      if (!coursId) {
        throw new Error("Course ID is required");
      }
      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-cours/${coursId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirProgrammationParClasse(classeId) {
    try {
      if (!classeId) {
        throw new Error("Class ID is required");
      }
      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateScheduledCours(scheduledId, updates) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }
      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async changeScheduledCoursState(scheduledId, newState) {
    try {
      if (!scheduledId || !newState) {
        throw new Error("Scheduled course ID and new state are required");
      }
      const response = await coursProgrammerApi.patch(
        `/cours-programmes/${scheduledId}/state`,
        { etatCoursProgramme: newState }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async obtenirProgrammationParParticipant(participantId) {
    try {
      if (!participantId) {
        throw new Error("Participant ID is required");
      }
      const response = await coursProgrammerApi.get(
        `/cours-programmes/by-participant/${participantId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async demarrerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }
      const updates = {
        etatCoursProgramme: "EN_COURS",
        dateDebutCoursEffectif: new Date().toISOString(),
      };
      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async terminerCours(scheduledId) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }
      const updates = {
        etatCoursProgramme: "TERMINE",
        dateFinCoursEffectif: new Date().toISOString(),
      };
      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async annulerCours(scheduledId, reason) {
    try {
      if (!scheduledId) {
        throw new Error("Scheduled course ID is required");
      }
      const updates = {
        etatCoursProgramme: "ANNULE",
        raisonAnnulation: reason || "",
      };
      const response = await coursProgrammerApi.put(
        `/cours-programmes/${scheduledId}`,
        updates
      );
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

export const coursProgrammerService = new CoursProgrammerService();
