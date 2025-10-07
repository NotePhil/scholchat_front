import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const exerciseProgrammerApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

exerciseProgrammerApi.interceptors.request.use(
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

class ExerciseProgrammerService {
  // ============ Exercise Programming Operations ============

  async programmerExercise(exerciseProgrammerData) {
    try {
      if (
        !exerciseProgrammerData.exerciseId ||
        !exerciseProgrammerData.programmeParId ||
        !exerciseProgrammerData.dateExoPrevue
      ) {
        throw new Error(
          "Missing required fields: exerciseId, programmeParId, or dateExoPrevue"
        );
      }

      if (!exerciseProgrammerData.etat) {
        exerciseProgrammerData.etat = "BROUILLON";
      }

      const formattedData = {
        exerciseId: exerciseProgrammerData.exerciseId,
        programmeParId: exerciseProgrammerData.programmeParId,
        dateExoPrevue: exerciseProgrammerData.dateExoPrevue,
        dateDebutExoEffectif: exerciseProgrammerData.dateDebutExoEffectif,
        dateFinExoEffectif: exerciseProgrammerData.dateFinExoEffectif,
        etat: exerciseProgrammerData.etat,
        classeIds: exerciseProgrammerData.classeIds || [],
      };

      console.log(
        "Programming exercise:",
        JSON.stringify(formattedData, null, 2)
      );

      const response = await exerciseProgrammerApi.post(
        "/exercises-programmer",
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Program exercise error:", error);
      this.handleError(error);
    }
  }

  async programmerEtDiffuserExercise(exerciseProgrammerData) {
    try {
      if (
        !exerciseProgrammerData.exerciseId ||
        !exerciseProgrammerData.programmeParId ||
        !exerciseProgrammerData.dateExoPrevue
      ) {
        throw new Error(
          "Missing required fields: exerciseId, programmeParId, or dateExoPrevue"
        );
      }

      if (!exerciseProgrammerData.etat) {
        exerciseProgrammerData.etat = "ACTIF";
      }

      const formattedData = {
        exerciseId: exerciseProgrammerData.exerciseId,
        programmeParId: exerciseProgrammerData.programmeParId,
        dateExoPrevue: exerciseProgrammerData.dateExoPrevue,
        dateDebutExoEffectif: exerciseProgrammerData.dateDebutExoEffectif,
        dateFinExoEffectif: exerciseProgrammerData.dateFinExoEffectif,
        etat: exerciseProgrammerData.etat,
        classeIds: exerciseProgrammerData.classeIds || [],
      };

      console.log(
        "Programming and diffusing exercise:",
        JSON.stringify(formattedData, null, 2)
      );

      const response = await exerciseProgrammerApi.post(
        "/exercises-programmer/programmer-et-diffuser",
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Program and diffuse exercise error:", error);
      this.handleError(error);
    }
  }

  async getExerciseProgrammeById(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("Exercise Programmer ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/exercises-programmer/${exerciseProgrammerId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getExercisesProgrammesParProfesseur(professeurId) {
    try {
      if (!professeurId) {
        throw new Error("Professor ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/exercises-programmer/professeur/${professeurId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getExercisesProgrammesParClasse(classeId) {
    try {
      if (!classeId) {
        throw new Error("Class ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/exercises-programmer/classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async mettreAJourEtatExerciseProgramme(exerciseProgrammerId, nouvelEtat) {
    try {
      if (!exerciseProgrammerId || !nouvelEtat) {
        throw new Error("Exercise Programmer ID and new state are required");
      }

      const response = await exerciseProgrammerApi.patch(
        `/exercises-programmer/${exerciseProgrammerId}/etat`,
        null,
        {
          params: {
            nouvelEtat: nouvelEtat,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update exercise programmer state error:", error);
      this.handleError(error);
    }
  }

  async supprimerExerciseProgramme(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("Exercise Programmer ID is required");
      }
      await exerciseProgrammerApi.delete(
        `/exercises-programmer/${exerciseProgrammerId}`
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Class Diffusion Operations ============

  async diffuserExerciseDansClasse(exerciseProgrammerId, classeId) {
    try {
      if (!exerciseProgrammerId || !classeId) {
        throw new Error("Exercise Programmer ID and Class ID are required");
      }

      const response = await exerciseProgrammerApi.post(
        `/exercises-programmer/${exerciseProgrammerId}/diffuser-classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      console.error("Diffuse exercise in class error:", error);
      this.handleError(error);
    }
  }

  async retirerExerciseDeClasse(exerciseProgrammerId, classeId) {
    try {
      if (!exerciseProgrammerId || !classeId) {
        throw new Error("Exercise Programmer ID and Class ID are required");
      }

      const response = await exerciseProgrammerApi.post(
        `/exercises-programmer/${exerciseProgrammerId}/retirer-classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      console.error("Remove exercise from class error:", error);
      this.handleError(error);
    }
  }

  // ============ Participation Management ============

  async participerExercise(participationData) {
    try {
      if (
        !participationData.utilisateurId ||
        !participationData.exerciseProgrammerId
      ) {
        throw new Error("User ID and Exercise Programmer ID are required");
      }

      const formattedData = {
        utilisateurId: participationData.utilisateurId,
        exerciseProgrammerId: participationData.exerciseProgrammerId,
        dateDebut: participationData.dateDebut || new Date().toISOString(),
        dateFin: participationData.dateFin,
      };

      const response = await exerciseProgrammerApi.post(
        "/participations-exercises",
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Participate exercise error:", error);
      this.handleError(error);
    }
  }

  async updateParticipation(participationData) {
    try {
      if (
        !participationData.utilisateurId ||
        !participationData.exerciseProgrammerId
      ) {
        throw new Error("User ID and Exercise Programmer ID are required");
      }

      const formattedData = {
        utilisateurId: participationData.utilisateurId,
        exerciseProgrammerId: participationData.exerciseProgrammerId,
        note: participationData.note,
        appreciation: participationData.appreciation,
      };

      const response = await exerciseProgrammerApi.put(
        "/participations-exercises",
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Update participation error:", error);
      this.handleError(error);
    }
  }

  async getParticipationsByExercise(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("Exercise Programmer ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/participations-exercises/exercise/${exerciseProgrammerId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteParticipation(utilisateurId, exerciseProgrammerId) {
    try {
      if (!utilisateurId || !exerciseProgrammerId) {
        throw new Error("User ID and Exercise Programmer ID are required");
      }
      await exerciseProgrammerApi.delete(
        `/participations-exercises/utilisateur/${utilisateurId}/exercise/${exerciseProgrammerId}`
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Answer Management ============

  async repondreQuestion(reponseData) {
    try {
      if (
        !reponseData.utilisateurId ||
        !reponseData.questionId ||
        !reponseData.reponseUtilisateur
      ) {
        throw new Error("User ID, Question ID, and answer are required");
      }

      const formattedData = {
        utilisateurId: reponseData.utilisateurId,
        questionId: reponseData.questionId,
        reponseUtilisateur: reponseData.reponseUtilisateur,
        estCorrecte: reponseData.estCorrecte,
        note: reponseData.note,
        appreciation: reponseData.appreciation,
      };

      const response = await exerciseProgrammerApi.post(
        "/reponses",
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Answer question error:", error);
      this.handleError(error);
    }
  }

  async getReponsesByQuestion(questionId) {
    try {
      if (!questionId) {
        throw new Error("Question ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/reponses/question/${questionId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReponsesByExercise(exerciseId) {
    try {
      if (!exerciseId) {
        throw new Error("Exercise ID is required");
      }
      const response = await exerciseProgrammerApi.get(
        `/reponses/exercise/${exerciseId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteReponse(utilisateurId, questionId) {
    try {
      if (!utilisateurId || !questionId) {
        throw new Error("User ID and Question ID are required");
      }
      await exerciseProgrammerApi.delete(
        `/reponses/utilisateur/${utilisateurId}/question/${questionId}`
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Helper Methods ============

  formatDateTime(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return null;
    }
  }

  validateDateRange(dateDebut, dateFin) {
    if (!dateDebut || !dateFin) return true;

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin < debut) {
      throw new Error("End date must be after start date");
    }

    return true;
  }

  // ============ Error Handler ============

  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        `HTTP ${error.response.status}: ${error.response.statusText}`;

      console.error("API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });

      throw new Error(errorMessage);
    } else if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error(
        "Network error. Please check your connection and server status."
      );
    } else {
      console.error("Request Setup Error:", error.message);
      throw new Error("Request setup error: " + error.message);
    }
  }
}

export const exerciseProgrammerService = new ExerciseProgrammerService();
