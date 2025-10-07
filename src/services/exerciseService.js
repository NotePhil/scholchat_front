import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// ============================================
// NIVEAU MAPPING
// ============================================
const mapNiveauToEnum = (niveau) => {
  const map = {
    "6ème": "COLLEGE",
    "5ème": "COLLEGE",
    "4ème": "COLLEGE",
    "3ème": "COLLEGE",
    "2nde": "LYCEE",
    "1ère": "LYCEE",
    Terminale: "LYCEE",
    "Licence 1": "UNIVERSITE",
    "Licence 2": "UNIVERSITE",
    "Licence 3": "UNIVERSITE",
    "Master 1": "UNIVERSITE",
    "Master 2": "UNIVERSITE",
    CP: "PRIMAIRE",
    CE1: "PRIMAIRE",
    CE2: "PRIMAIRE",
    CM1: "PRIMAIRE",
    CM2: "PRIMAIRE",
  };
  return map[niveau] || niveau;
};

// ============================================
// API INSTANCE CONFIGURATION
// ============================================
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("Authentication error - Token may be expired");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// ============================================
// BASE ERROR HANDLER
// ============================================
const handleError = (error, context = "") => {
  if (error.response) {
    const errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      `HTTP ${error.response.status}: ${error.response.statusText}`;

    console.error(`API Error [${context}]:`, {
      status: error.response.status,
      data: error.response.data,
    });

    if (error.response.status === 401) {
      throw new Error("Non authentifié. Veuillez vous reconnecter.");
    } else if (error.response.status === 403) {
      throw new Error(
        "Accès refusé. Vous n'avez pas les permissions nécessaires."
      );
    }

    throw new Error(errorMessage);
  } else if (error.request) {
    throw new Error("Erreur réseau. Veuillez vérifier votre connexion.");
  } else {
    throw new Error("Erreur de configuration: " + error.message);
  }
};

// ============================================
// EXERCISE SERVICE
// ============================================
class ExerciseService {
  constructor() {
    this.api = createApiInstance();
  }

  async createExercise(exerciseData) {
    try {
      if (
        !exerciseData.nom ||
        !exerciseData.description ||
        !exerciseData.redacteurId ||
        !exerciseData.niveau
      ) {
        throw new Error("Champs requis manquants");
      }

      const formattedData = {
        nom: exerciseData.nom,
        description: exerciseData.description,
        niveau: mapNiveauToEnum(exerciseData.niveau),
        restriction: exerciseData.restriction || "PRIVE",
        redacteurId: exerciseData.redacteurId,
        etat: exerciseData.etat || "ACTIF",
      };

      console.log("Creating exercise:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.post("/exercises", formattedData);
      return response.data;
    } catch (error) {
      handleError(error, "createExercise");
    }
  }

  async getExerciseById(exerciseId) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");
      const response = await this.api.get(`/exercises/${exerciseId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getExerciseById");
    }
  }

  async getExercisesByProfesseur(professeurId) {
    try {
      if (!professeurId) throw new Error("L'ID du professeur est requis");
      const response = await this.api.get(
        `/exercises/professeur/${professeurId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesByProfesseur");
    }
  }

  async getExercisesByNiveau(niveau) {
    try {
      if (!niveau) throw new Error("Le niveau est requis");
      const response = await this.api.get(
        `/exercises/niveau/${mapNiveauToEnum(niveau)}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesByNiveau");
    }
  }

  async getExercisesAccessibles(userId) {
    try {
      if (!userId) throw new Error("L'ID utilisateur est requis");
      const response = await this.api.get(`/exercises/accessibles/${userId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesAccessibles");
    }
  }

  async getExercisesByCours(coursId) {
    try {
      if (!coursId) throw new Error("L'ID du cours est requis");
      const response = await this.api.get(`/exercises/cours/${coursId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesByCours");
    }
  }

  async updateExercise(exerciseId, updates) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");

      const formattedData = {
        nom: updates.nom,
        description: updates.description,
        niveau: updates.niveau ? mapNiveauToEnum(updates.niveau) : undefined,
        restriction: updates.restriction,
        etat: updates.etat,
      };

      console.log("Updating exercise:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.put(
        `/exercises/${exerciseId}`,
        formattedData
      );
      return response.data;
    } catch (error) {
      handleError(error, "updateExercise");
    }
  }

  async deleteExercise(exerciseId) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");
      await this.api.delete(`/exercises/${exerciseId}`);
    } catch (error) {
      handleError(error, "deleteExercise");
    }
  }

  async lierExerciseAMatiere(exerciseId, matiereId) {
    try {
      if (!exerciseId || !matiereId) {
        throw new Error("L'ID de l'exercice et de la matière sont requis");
      }
      const response = await this.api.post(
        `/exercises/${exerciseId}/lier-matiere/${matiereId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "lierExerciseAMatiere");
    }
  }

  async delierExerciseDeMatiere(exerciseId, matiereId) {
    try {
      if (!exerciseId || !matiereId) {
        throw new Error("L'ID de l'exercice et de la matière sont requis");
      }
      const response = await this.api.post(
        `/exercises/${exerciseId}/delier-matiere/${matiereId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "delierExerciseDeMatiere");
    }
  }

  async lierExerciseACours(exerciseId, coursId) {
    try {
      if (!exerciseId || !coursId) {
        throw new Error("L'ID de l'exercice et du cours sont requis");
      }
      const response = await this.api.post(
        `/exercises/${exerciseId}/lier-cours/${coursId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "lierExerciseACours");
    }
  }

  async delierExerciseDeCours(exerciseId, coursId) {
    try {
      if (!exerciseId || !coursId) {
        throw new Error("L'ID de l'exercice et du cours sont requis");
      }
      const response = await this.api.post(
        `/exercises/${exerciseId}/delier-cours/${coursId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "delierExerciseDeCours");
    }
  }
}

// ============================================
// EXERCISE PROGRAMMER SERVICE - FIXED
// ============================================
class ExerciseProgrammerService {
  constructor() {
    this.api = createApiInstance();
  }

  async programmerExercise(exerciseProgrammerData) {
    try {
      // VALIDATION STRICTE
      if (!exerciseProgrammerData.exerciseId) {
        throw new Error("exerciseId est requis");
      }
      if (!exerciseProgrammerData.programmeParId) {
        throw new Error("programmeParId est requis");
      }
      if (!exerciseProgrammerData.dateExoPrevue) {
        throw new Error("dateExoPrevue est requise");
      }
      if (!exerciseProgrammerData.dateDebutExoEffectif) {
        throw new Error("dateDebutExoEffectif est requise");
      }
      if (!exerciseProgrammerData.dateFinExoEffectif) {
        throw new Error("dateFinExoEffectif est requise");
      }

      // FORMAT EXACT POUR LE BACKEND - Les dates doivent être des timestamps ou ISO strings
      const formattedData = {
        exerciseId: exerciseProgrammerData.exerciseId,
        programmeParId: exerciseProgrammerData.programmeParId,
        dateExoPrevue:
          typeof exerciseProgrammerData.dateExoPrevue === "string"
            ? exerciseProgrammerData.dateExoPrevue
            : new Date(exerciseProgrammerData.dateExoPrevue).toISOString(),
        dateDebutExoEffectif:
          typeof exerciseProgrammerData.dateDebutExoEffectif === "string"
            ? exerciseProgrammerData.dateDebutExoEffectif
            : new Date(
                exerciseProgrammerData.dateDebutExoEffectif
              ).toISOString(),
        dateFinExoEffectif:
          typeof exerciseProgrammerData.dateFinExoEffectif === "string"
            ? exerciseProgrammerData.dateFinExoEffectif
            : new Date(exerciseProgrammerData.dateFinExoEffectif).toISOString(),
        etat: exerciseProgrammerData.etat || "BROUILLON",
        classeIds: exerciseProgrammerData.classeIds || [],
      };

      console.log(
        "Programming exercise - DATA SENT:",
        JSON.stringify(formattedData, null, 2)
      );
      const response = await this.api.post(
        "/exercises-programmer",
        formattedData
      );
      console.log("Programming exercise - RESPONSE:", response.data);
      return response.data;
    } catch (error) {
      console.error("Programming exercise - ERROR:", error);
      handleError(error, "programmerExercise");
    }
  }

  async programmerEtDiffuserExercise(exerciseProgrammerData) {
    try {
      // VALIDATION STRICTE
      if (!exerciseProgrammerData.exerciseId) {
        throw new Error("exerciseId est requis");
      }
      if (!exerciseProgrammerData.programmeParId) {
        throw new Error("programmeParId est requis");
      }
      if (!exerciseProgrammerData.dateExoPrevue) {
        throw new Error("dateExoPrevue est requise");
      }
      if (!exerciseProgrammerData.dateDebutExoEffectif) {
        throw new Error("dateDebutExoEffectif est requise");
      }
      if (!exerciseProgrammerData.dateFinExoEffectif) {
        throw new Error("dateFinExoEffectif est requise");
      }

      // FORMAT EXACT POUR LE BACKEND
      const formattedData = {
        exerciseId: exerciseProgrammerData.exerciseId,
        programmeParId: exerciseProgrammerData.programmeParId,
        dateExoPrevue: exerciseProgrammerData.dateExoPrevue,
        dateDebutExoEffectif: exerciseProgrammerData.dateDebutExoEffectif,
        dateFinExoEffectif: exerciseProgrammerData.dateFinExoEffectif,
        etat: exerciseProgrammerData.etat || "ACTIF",
        classeIds: exerciseProgrammerData.classeIds || [],
      };

      console.log(
        "Programming and diffusing - DATA SENT:",
        JSON.stringify(formattedData, null, 2)
      );
      const response = await this.api.post(
        "/exercises-programmer/programmer-et-diffuser",
        formattedData
      );
      console.log("Programming and diffusing - RESPONSE:", response.data);
      return response.data;
    } catch (error) {
      console.error("Programming and diffusing - ERROR:", error);
      handleError(error, "programmerEtDiffuserExercise");
    }
  }

  async getExerciseProgrammeById(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("L'ID de l'exercice programmé est requis");
      }
      const response = await this.api.get(
        `/exercises-programmer/${exerciseProgrammerId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getExerciseProgrammeById");
    }
  }

  async getExercisesProgrammesParProfesseur(professeurId) {
    try {
      if (!professeurId) throw new Error("L'ID du professeur est requis");
      const response = await this.api.get(
        `/exercises-programmer/professeur/${professeurId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesProgrammesParProfesseur");
    }
  }

  async getExercisesProgrammesParClasse(classeId) {
    try {
      if (!classeId) throw new Error("L'ID de la classe est requis");
      const response = await this.api.get(
        `/exercises-programmer/classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getExercisesProgrammesParClasse");
    }
  }

  async mettreAJourEtatExerciseProgramme(exerciseProgrammerId, nouvelEtat) {
    try {
      if (!exerciseProgrammerId || !nouvelEtat) {
        throw new Error("L'ID et le nouvel état sont requis");
      }

      const response = await this.api.patch(
        `/exercises-programmer/${exerciseProgrammerId}/etat`,
        null,
        { params: { nouvelEtat } }
      );
      return response.data;
    } catch (error) {
      handleError(error, "mettreAJourEtatExerciseProgramme");
    }
  }

  async supprimerExerciseProgramme(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("L'ID de l'exercice programmé est requis");
      }
      await this.api.delete(`/exercises-programmer/${exerciseProgrammerId}`);
    } catch (error) {
      handleError(error, "supprimerExerciseProgramme");
    }
  }

  async diffuserExerciseDansClasse(exerciseProgrammerId, classeId) {
    try {
      if (!exerciseProgrammerId || !classeId) {
        throw new Error("L'ID de l'exercice et de la classe sont requis");
      }

      const response = await this.api.post(
        `/exercises-programmer/${exerciseProgrammerId}/diffuser-classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "diffuserExerciseDansClasse");
    }
  }

  async retirerExerciseDeClasse(exerciseProgrammerId, classeId) {
    try {
      if (!exerciseProgrammerId || !classeId) {
        throw new Error("L'ID de l'exercice et de la classe sont requis");
      }

      const response = await this.api.post(
        `/exercises-programmer/${exerciseProgrammerId}/retirer-classe/${classeId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "retirerExerciseDeClasse");
    }
  }
}

// ============================================
// QUESTION REPONSE SERVICE
// ============================================
class QuestionReponseService {
  constructor() {
    this.api = createApiInstance();
  }

  async createQuestion(exerciseId, questionData) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");
      if (!questionData.intitule || !questionData.typeQuestion) {
        throw new Error("L'intitulé et le type de question sont requis");
      }

      const formattedData = {
        intitule: questionData.intitule,
        reponse: questionData.reponse || "",
        typeQuestion: questionData.typeQuestion,
      };

      console.log("Creating question:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.post(
        `/questions/exercise/${exerciseId}`,
        formattedData
      );
      return response.data;
    } catch (error) {
      handleError(error, "createQuestion");
    }
  }

  async getQuestionsByExercise(exerciseId) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");
      const response = await this.api.get(`/questions/exercise/${exerciseId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getQuestionsByExercise");
    }
  }

  async updateQuestion(questionId, questionData) {
    try {
      if (!questionId) throw new Error("L'ID de la question est requis");

      const formattedData = {
        intitule: questionData.intitule,
        reponse: questionData.reponse,
        typeQuestion: questionData.typeQuestion,
      };

      console.log("Updating question:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.put(
        `/questions/${questionId}`,
        formattedData
      );
      return response.data;
    } catch (error) {
      handleError(error, "updateQuestion");
    }
  }

  async deleteQuestion(questionId) {
    try {
      if (!questionId) throw new Error("L'ID de la question est requis");
      await this.api.delete(`/questions/${questionId}`);
    } catch (error) {
      handleError(error, "deleteQuestion");
    }
  }
}

// ============================================
// REPONDRE (ANSWER) SERVICE
// ============================================
class RepondreService {
  constructor() {
    this.api = createApiInstance();
  }

  async repondreQuestion(reponseData) {
    try {
      if (
        !reponseData.utilisateurId ||
        !reponseData.questionId ||
        !reponseData.reponseUtilisateur
      ) {
        throw new Error(
          "L'ID utilisateur, l'ID question et la réponse sont requis"
        );
      }

      const formattedData = {
        utilisateurId: reponseData.utilisateurId,
        questionId: reponseData.questionId,
        reponseUtilisateur: reponseData.reponseUtilisateur,
        estCorrecte: reponseData.estCorrecte,
        note: reponseData.note,
        appreciation: reponseData.appreciation,
      };

      console.log("Submitting answer:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.post("/reponses", formattedData);
      return response.data;
    } catch (error) {
      handleError(error, "repondreQuestion");
    }
  }

  async updateReponse(reponseData) {
    try {
      if (!reponseData.utilisateurId || !reponseData.questionId) {
        throw new Error("L'ID utilisateur et l'ID question sont requis");
      }

      const formattedData = {
        utilisateurId: reponseData.utilisateurId,
        questionId: reponseData.questionId,
        reponseUtilisateur: reponseData.reponseUtilisateur,
        estCorrecte: reponseData.estCorrecte,
        note: reponseData.note,
        appreciation: reponseData.appreciation,
      };

      console.log("Updating answer:", JSON.stringify(formattedData, null, 2));
      const response = await this.api.put("/reponses", formattedData);
      return response.data;
    } catch (error) {
      handleError(error, "updateReponse");
    }
  }

  async getReponsesByUtilisateur(utilisateurId) {
    try {
      if (!utilisateurId) throw new Error("L'ID utilisateur est requis");
      const response = await this.api.get(
        `/reponses/utilisateur/${utilisateurId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getReponsesByUtilisateur");
    }
  }

  async getReponsesByQuestion(questionId) {
    try {
      if (!questionId) throw new Error("L'ID de la question est requis");
      const response = await this.api.get(`/reponses/question/${questionId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getReponsesByQuestion");
    }
  }

  async getReponsesByExercise(exerciseId) {
    try {
      if (!exerciseId) throw new Error("L'ID de l'exercice est requis");
      const response = await this.api.get(`/reponses/exercise/${exerciseId}`);
      return response.data;
    } catch (error) {
      handleError(error, "getReponsesByExercise");
    }
  }

  async getReponse(utilisateurId, questionId) {
    try {
      if (!utilisateurId || !questionId) {
        throw new Error("L'ID utilisateur et l'ID question sont requis");
      }
      const response = await this.api.get(
        `/reponses/utilisateur/${utilisateurId}/question/${questionId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getReponse");
    }
  }

  async deleteReponse(utilisateurId, questionId) {
    try {
      if (!utilisateurId || !questionId) {
        throw new Error("L'ID utilisateur et l'ID question sont requis");
      }
      await this.api.delete(
        `/reponses/utilisateur/${utilisateurId}/question/${questionId}`
      );
    } catch (error) {
      handleError(error, "deleteReponse");
    }
  }
}

// ============================================
// PARTICIPATION EXERCISE SERVICE
// ============================================
class ParticipationExerciseService {
  constructor() {
    this.api = createApiInstance();
  }

  async participerExercise(participationData) {
    try {
      if (
        !participationData.utilisateurId ||
        !participationData.exerciseProgrammerId
      ) {
        throw new Error(
          "L'ID utilisateur et l'ID exercice programmé sont requis"
        );
      }

      const formattedData = {
        utilisateurId: participationData.utilisateurId,
        exerciseProgrammerId: participationData.exerciseProgrammerId,
        dateDebut: participationData.dateDebut || new Date().toISOString(),
        dateFin: participationData.dateFin,
        note: participationData.note,
        appreciation: participationData.appreciation,
      };

      console.log(
        "Participating in exercise:",
        JSON.stringify(formattedData, null, 2)
      );
      const response = await this.api.post(
        "/participations-exercises",
        formattedData
      );
      return response.data;
    } catch (error) {
      handleError(error, "participerExercise");
    }
  }

  async updateParticipation(participationData) {
    try {
      if (
        !participationData.utilisateurId ||
        !participationData.exerciseProgrammerId
      ) {
        throw new Error(
          "L'ID utilisateur et l'ID exercice programmé sont requis"
        );
      }

      const formattedData = {
        utilisateurId: participationData.utilisateurId,
        exerciseProgrammerId: participationData.exerciseProgrammerId,
        dateDebut: participationData.dateDebut,
        dateFin: participationData.dateFin,
        note: participationData.note,
        appreciation: participationData.appreciation,
      };

      console.log(
        "Updating participation:",
        JSON.stringify(formattedData, null, 2)
      );
      const response = await this.api.put(
        "/participations-exercises",
        formattedData
      );
      return response.data;
    } catch (error) {
      handleError(error, "updateParticipation");
    }
  }

  async getParticipationsByUtilisateur(utilisateurId) {
    try {
      if (!utilisateurId) throw new Error("L'ID utilisateur est requis");
      const response = await this.api.get(
        `/participations-exercises/utilisateur/${utilisateurId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getParticipationsByUtilisateur");
    }
  }

  async getParticipationsByExercise(exerciseProgrammerId) {
    try {
      if (!exerciseProgrammerId) {
        throw new Error("L'ID de l'exercice programmé est requis");
      }
      const response = await this.api.get(
        `/participations-exercises/exercise/${exerciseProgrammerId}`
      );
      return response.data;
    } catch (error) {
      handleError(error, "getParticipationsByExercise");
    }
  }

  async deleteParticipation(utilisateurId, exerciseProgrammerId) {
    try {
      if (!utilisateurId || !exerciseProgrammerId) {
        throw new Error(
          "L'ID utilisateur et l'ID exercice programmé sont requis"
        );
      }
      await this.api.delete(
        `/participations-exercises/utilisateur/${utilisateurId}/exercise/${exerciseProgrammerId}`
      );
    } catch (error) {
      handleError(error, "deleteParticipation");
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatDateTime = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.error("Date formatting error:", error);
    return null;
  }
};

const validateDateRange = (dateDebut, dateFin) => {
  if (!dateDebut || !dateFin) return true;

  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (fin < debut) {
    throw new Error("La date de fin doit être après la date de début");
  }

  return true;
};

// ============================================
// EXPORTS
// ============================================
export const exerciseService = new ExerciseService();
export const exerciseProgrammerService = new ExerciseProgrammerService();
export const questionReponseService = new QuestionReponseService();
export const repondreService = new RepondreService();
export const participationExerciseService = new ParticipationExerciseService();

export const utils = {
  formatDateTime,
  validateDateRange,
  mapNiveauToEnum,
};

export default {
  exercise: exerciseService,
  exerciseProgrammer: exerciseProgrammerService,
  questionReponse: questionReponseService,
  repondre: repondreService,
  participationExercise: participationExerciseService,
  utils,
};
